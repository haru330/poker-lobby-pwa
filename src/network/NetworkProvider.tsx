import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { useGameDispatch, useGameState } from '../state/GameContext';
import type { NetworkMessage } from './messages';
import type { Action } from '../types';
import { createPlayer } from '../utils/player';
import '../styles/lobby.css';

const TOKEN_KEY = 'poker-lobby-session-token';
const NAME_KEY = 'poker-lobby-username';
const RECONNECT_DELAY_MS = 1500;
const PROBE_TIMEOUT_MS = 3000;
const CARD_HEIGHT = 484;

// TURN relay so connections can establish even when both peers are behind
// restrictive NATs/firewalls (e.g. eduroam) and direct P2P isn't possible.
// Falls back to STUN-only if the relay is unreachable.
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

// In local/offline play, use a PeerServer reachable at the same host the page
// was loaded from, instead of the public broker (which needs internet).
// See docs/adr/0004-local-peerjs-server-for-offline-play.md.
const LOCAL_PEER_EXTRA = { host: window.location.hostname, port: 9000, path: '/' };

/**
 * Probes whether the public PeerJS broker is reachable by attempting to open
 * a throwaway connection to it. Used to decide, per-device, whether to use
 * the public broker (online mode — reachable by cellular and LAN guests
 * alike) or the local PeerServer (offline-hotspot mode — LAN only).
 */
function detectPeerConfig(): Promise<PeerOptions> {
  return new Promise((resolve) => {
    const onlineConfig: PeerOptions = { config: { iceServers: ICE_SERVERS } };
    const localConfig: PeerOptions = { config: { iceServers: ICE_SERVERS }, ...LOCAL_PEER_EXTRA };

    const probe = new Peer(onlineConfig);
    let settled = false;

    const finish = (config: PeerOptions) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      probe.destroy();
      resolve(config);
    };

    const timer = setTimeout(() => finish(localConfig), PROBE_TIMEOUT_MS);
    probe.on('open', () => finish(onlineConfig));
    probe.on('error', () => finish(localConfig));
  });
}

type Role = 'host' | 'guest' | null;

interface NetworkApi {
  /** Sends a player action. Hosts apply it directly; guests send it to the host for approval. */
  sendAction: (action: Action) => void;
  /** Tears down the peer connection so the lobby can be re-joined/hosted fresh. */
  leave: () => void;
}

const NetworkContext = createContext<NetworkApi>({ sendAction: () => {}, leave: () => {} });

export function useNetwork(): NetworkApi {
  return useContext(NetworkContext);
}

/**
 * Sets up the PeerJS connection once a room code exists, and keeps it
 * running across host migration (see CONTEXT.md: Host Migration).
 * Renders nothing — purely a side-effect provider.
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const peerRef = useRef<Peer | null>(null);
  const roleRef = useRef<Role>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map()); // host side: connId -> conn
  const connPlayerRef = useRef<Map<string, string>>(new Map()); // host side: connId -> playerId
  const hostConnRef = useRef<DataConnection | null>(null); // guest side
  const initializedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerConfigRef = useRef<PeerOptions>({ config: { iceServers: ICE_SERVERS } });
  const [peerConfig, setPeerConfig] = useState<PeerOptions | null>(null);
  const [showConnecting, setShowConnecting] = useState(true);
  const [connectingDismissed, setConnectingDismissed] = useState(false);

  // --- Probe connectivity once on load, before any host/join option is shown ---
  useEffect(() => {
    detectPeerConfig().then((config) => {
      peerConfigRef.current = config;
      setPeerConfig(config);
    });
  }, []);

  // --- Once connectivity is known, slide the connecting card down and out of the way ---
  useEffect(() => {
    if (!peerConfig) return;
    setConnectingDismissed(true);
    const timer = setTimeout(() => setShowConnecting(false), 450);
    return () => clearTimeout(timer);
  }, [peerConfig]);

  // --- Start as host or guest once roomCode is known (connectivity already probed) ---
  useEffect(() => {
    if (initializedRef.current) return;
    if (!state.roomCode) return;
    if (!peerConfig) return;

    const myId = localStorage.getItem(TOKEN_KEY) ?? '';
    const me = state.players.find((p) => p.id === myId);

    initializedRef.current = true;

    if (me?.isHost) {
      startAsHost(state.roomCode);
    } else {
      startAsGuest(state.roomCode);
    }

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.roomCode, peerConfig]);

  // --- Host: broadcast full state on every change ---
  useEffect(() => {
    if (roleRef.current !== 'host') return;
    broadcastState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function broadcastState(s: typeof state) {
    const msg: NetworkMessage = { type: 'STATE', state: s };
    connectionsRef.current.forEach((conn) => {
      if (conn.open) conn.send(msg);
    });
  }

  function startAsHost(roomCode: string) {
    roleRef.current = 'host';
    const peer = new Peer(roomCode, peerConfigRef.current);
    peerRef.current = peer;

    peer.on('connection', (conn) => {
      connectionsRef.current.set(conn.connectionId, conn);

      conn.on('data', (data) => handleHostMessage(conn, data as NetworkMessage));

      conn.on('close', () => {
        const playerId = connPlayerRef.current.get(conn.connectionId);
        connectionsRef.current.delete(conn.connectionId);
        connPlayerRef.current.delete(conn.connectionId);
        if (playerId) {
          dispatchRef.current({ type: 'SET_PLAYER_STATUS', playerId, status: 'disconnected' });
        }
      });
    });

    peer.on('error', (err) => console.error('[peer:host]', err));
  }

  function handleHostMessage(conn: DataConnection, msg: NetworkMessage) {
    switch (msg.type) {
      case 'JOIN': {
        try {
          dispatchRef.current({
            type: 'ADD_PLAYER',
            player: createPlayer(msg.sessionToken, msg.name, stateRef.current.startingChips, false),
          });
          connPlayerRef.current.set(conn.connectionId, msg.sessionToken);
          // Send current state immediately; the broadcast effect will keep it in sync afterward.
          if (conn.open) conn.send({ type: 'STATE', state: stateRef.current } satisfies NetworkMessage);
        } catch (err) {
          const reason = err instanceof Error ? err.message : 'join failed';
          if (conn.open) conn.send({ type: 'JOIN_REJECTED', reason } satisfies NetworkMessage);
          conn.close();
        }
        break;
      }

      case 'ACTION': {
        dispatchRef.current({
          type: 'PROPOSE_ACTION',
          action: msg.action,
          id: `${msg.action.playerId}-${Date.now()}`,
        });
        break;
      }
    }
  }

  function startAsGuest(roomCode: string) {
    roleRef.current = 'guest';
    const peer = new Peer(peerConfigRef.current);
    peerRef.current = peer;

    peer.on('open', () => connectToHost(peer, roomCode));
    peer.on('error', (err) => {
      console.error('[peer:guest]', err);
      if (err.type === 'peer-unavailable') {
        // eslint-disable-next-line no-alert
        alert('Room not found.');
        leave();
        dispatchRef.current({ type: 'LEAVE_LOBBY' });
      }
    });
  }

  function connectToHost(peer: Peer, roomCode: string) {
    const conn = peer.connect(roomCode);
    hostConnRef.current = conn;

    conn.on('open', () => {
      const myId = localStorage.getItem(TOKEN_KEY) ?? '';
      const name = localStorage.getItem(NAME_KEY) ?? 'Player';
      conn.send({ type: 'JOIN', name, sessionToken: myId } satisfies NetworkMessage);
    });

    conn.on('data', (data) => handleGuestMessage(data as NetworkMessage));

    conn.on('close', () => {
      hostConnRef.current = null;
      handleHostLost(peer, roomCode);
    });

    conn.on('error', (err) => console.error('[conn:guest]', err));
  }

  function handleGuestMessage(msg: NetworkMessage) {
    switch (msg.type) {
      case 'STATE':
        dispatchRef.current({ type: 'REPLACE_STATE', state: msg.state });
        break;

      case 'JOIN_REJECTED':
        // eslint-disable-next-line no-alert
        alert(`Could not join lobby: ${msg.reason}`);
        dispatchRef.current({ type: 'SET_PHASE', phase: 'home' });
        break;
    }
  }

  function handleHostLost(peer: Peer, roomCode: string) {
    const s = stateRef.current;
    const myId = localStorage.getItem(TOKEN_KEY) ?? '';
    const oldHost = s.players.find((p) => p.isHost);
    const candidates = s.players.filter((p) => !p.isHost && p.status === 'connected');
    const nextHost = candidates[0];

    if (nextHost && nextHost.id === myId && oldHost) {
      // Promote self to host using the last synced state.
      dispatchRef.current({ type: 'PROMOTE_TO_HOST', newHostId: myId, removePlayerId: oldHost.id });
      peer.destroy();
      roleRef.current = 'host';
      connectionsRef.current = new Map();
      connPlayerRef.current = new Map();
      startAsHost(roomCode);
      return;
    }

    // Not the next host (or no candidate yet): keep retrying the same peer
    // until the new host registers under the room code.
    retryTimerRef.current = setTimeout(() => connectToHost(peer, roomCode), RECONNECT_DELAY_MS);
  }

  function leave() {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    roleRef.current = null;
    connectionsRef.current = new Map();
    connPlayerRef.current = new Map();
    hostConnRef.current = null;
    initializedRef.current = false;
  }

  function sendAction(action: Action) {
    if (roleRef.current === 'host') {
      dispatchRef.current({ type: 'PROPOSE_ACTION', action, id: `${action.playerId}-${Date.now()}` });
    } else if (hostConnRef.current?.open) {
      hostConnRef.current.send({ type: 'ACTION', action } satisfies NetworkMessage);
    }
  }

  const connectingCenteredBottom = Math.max(0, window.innerHeight / 2 - CARD_HEIGHT / 2);
  const connectingOffscreenBottom = -(CARD_HEIGHT + 40);

  return (
    <NetworkContext.Provider value={{ sendAction, leave }}>
      {children}
      {showConnecting && (
        <div
          className="pl-connecting-wrap"
          style={{ bottom: connectingDismissed ? connectingOffscreenBottom : connectingCenteredBottom }}
        >
          <div
            className="pl-card2 pl-card2--paper"
            style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
          >
            <h1>Hold'em Stares</h1>
            <p style={{ fontSize: '1.1rem' }}>Checking connection&hellip;</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Detecting whether the internet is reachable.</p>
          </div>
        </div>
      )}
    </NetworkContext.Provider>
  );
}
