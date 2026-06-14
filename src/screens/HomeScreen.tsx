import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { useGameDispatch } from '../state/GameContext';
import { generateRoomCode, generateSessionToken } from '../utils/roomCode';
import { createPlayer } from '../utils/player';
import '../styles/lobby.css';

const NAME_KEY = 'poker-lobby-username';
const TOKEN_KEY = 'poker-lobby-session-token';

const CARD_HEIGHT = 484;
const LINE_RATIO = 0.8;

type Mode = 'home' | 'join' | 'host';
type Zone = 'join' | 'host' | 'home' | null;

export function HomeScreen() {
  const dispatch = useGameDispatch();
  const [name, setName] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('room');
    return localStorage.getItem(NAME_KEY) ?? (fromUrl ? '' : 'Player');
  });
  const [joinCode, setJoinCode] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('room');
    return fromUrl ? fromUrl.toUpperCase().slice(0, 4) : '';
  });
  const [mode, setMode] = useState<Mode>('home');
  const [holding, setHolding] = useState(false);
  const [hoverZone, setHoverZone] = useState<Zone>(null);

  function updateName(value: string) {
    setName(value);
    localStorage.setItem(NAME_KEY, value);
  }

  function host() {
    const roomCode = generateRoomCode();
    const sessionToken = generateSessionToken();
    localStorage.setItem(TOKEN_KEY, sessionToken);

    dispatch({ type: 'SET_ROOM_CODE', roomCode });
    dispatch({ type: 'ADD_PLAYER', player: createPlayer(sessionToken, name, 100, true) });
    dispatch({ type: 'SET_PHASE', phase: 'lobby' });
  }

  function join() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) return;
    if (!localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, generateSessionToken());
    }
    dispatch({ type: 'SET_ROOM_CODE', roomCode: code });
    dispatch({ type: 'SET_PHASE', phase: 'lobby' });
  }

  const lineY = window.innerHeight * LINE_RATIO;

  function zoneAt(point: { x: number; y: number }): Zone {
    if (point.y >= lineY) return 'home';
    return point.x < window.innerWidth / 2 ? 'join' : 'host';
  }

  function onDrag(_: unknown, info: PanInfo) {
    if (mode === 'home') {
      setHoverZone(zoneAt(info.point));
    } else if (info.point.y >= lineY) {
      setHoverZone('home');
    } else {
      setHoverZone(null);
    }
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    setHolding(false);
    setHoverZone(null);

    if (mode === 'home') {
      const zone = zoneAt(info.point);
      if (zone === 'join') {
        setMode('join');
      } else if (zone === 'host') {
        setMode('host');
        // Let the card snap to center before swapping to the lobby/connecting screens.
        setTimeout(host, 350);
      }
      // zone === 'home': animate prop springs it back to rest.
    } else if (info.point.y >= lineY) {
      setMode('home');
    }
  }

  const ready = joinCode.length === 4 && name.trim().length > 0;
  const centeredBottom = Math.max(0, window.innerHeight / 2 - CARD_HEIGHT / 2);
  const homeBottom = -(CARD_HEIGHT / 2 + window.innerHeight * 0.1);

  const modeClass = mode === 'join' ? 'pl-hs-card--hover-join' : mode === 'host' ? 'pl-hs-card--hover-host' : '';
  const hoverClass =
    mode === 'home'
      ? hoverZone === 'join'
        ? 'pl-hs-card--hover-join'
        : hoverZone === 'host'
          ? 'pl-hs-card--hover-host'
          : ''
      : '';

  return (
    <div className="pl-screen pl-screen--table">
      <div className="pl-table-line" />
      {mode === 'home' && (
        <>
          <div className={`pl-drop-zone pl-drop-zone--join ${holding ? 'pl-drop-zone--visible' : ''}`}>
            <span className="pl-drop-zone-label">JOIN</span>
          </div>
          <div className={`pl-drop-zone pl-drop-zone--host ${holding ? 'pl-drop-zone--visible' : ''}`}>
            <span className="pl-drop-zone-label">HOST</span>
          </div>
          <div className={`pl-drop-zone pl-drop-zone--home ${holding ? 'pl-drop-zone--visible' : ''}`}>
            <span className="pl-drop-zone-label">HOME</span>
          </div>
        </>
      )}
      {mode !== 'home' && (
        <div className={`pl-drop-zone pl-drop-zone--home ${holding ? 'pl-drop-zone--visible' : ''}`}>
          <span className="pl-drop-zone-label">HOME</span>
        </div>
      )}

      <div className="pl-hs-card-wrap" style={{ bottom: mode === 'home' ? homeBottom : centeredBottom }}>
        <motion.div
          className={`pl-hs-card ${modeClass} ${hoverClass}`}
          drag
          dragSnapToOrigin
          dragElastic={0.2}
          onDragStart={() => setHolding(true)}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          whileTap={{ cursor: 'grabbing' }}
        >
        {mode === 'home' && (
          <>
            <h1>Hold'em Stares</h1>
            <input
              className="pl-input"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
            />
            <p className="pl-hint">hold &amp; drag — left to join, right to host</p>
          </>
        )}

        {mode === 'join' && (
          <>
            <p style={{ margin: '0.5rem 0', textAlign: 'center', fontWeight: 700, letterSpacing: '0.2em' }}>
              ENTER ROOM CODE
            </p>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <input
                className="pl-code-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="____"
                maxLength={4}
                style={{ width: '100%' }}
              />
            </div>
            <button
              className={`pl-button pl-button--confirm ${ready ? 'pl-ready' : ''}`}
              disabled={!ready}
              onClick={join}
              style={{ width: '100%' }}
            >
              Join Lobby
            </button>
            <p className="pl-hint">hold &amp; drag below the line to go back</p>
          </>
        )}

        {mode === 'host' && <h1>Hold'em Stares</h1>}
        </motion.div>
      </div>
    </div>
  );
}
