import { useState } from 'react';
import { useGameDispatch } from '../state/GameContext';
import { generateRoomCode, generateSessionToken } from '../utils/roomCode';
import { createPlayer } from '../utils/player';

const NAME_KEY = 'poker-lobby-username';
const TOKEN_KEY = 'poker-lobby-session-token';

export function HomeScreen() {
  const dispatch = useGameDispatch();
  const [joinCode, setJoinCode] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('room');
    return fromUrl ? fromUrl.toUpperCase().slice(0, 4) : '';
  });
  const [name, setName] = useState(localStorage.getItem(NAME_KEY) ?? 'Player');

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

    // The NetworkProvider connects to the host (room code = host's peer ID)
    // and sends a JOIN message once roomCode + phase are set; the host's
    // broadcast then populates our player list.
    dispatch({ type: 'SET_ROOM_CODE', roomCode: code });
    dispatch({ type: 'SET_PHASE', phase: 'lobby' });
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 360, margin: '0 auto' }}>
      <h1>Hi there</h1>
      <input
        value={name}
        onChange={(e) => updateName(e.target.value)}
        placeholder="Your name"
        maxLength={20}
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', marginBottom: '1rem' }}
      />
      <button onClick={host} disabled={!name.trim()} style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
        Host a Lobby
      </button>

      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>or</div>

      <input
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
        placeholder="4-letter code"
        maxLength={4}
        style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.3em' }}
      />
      <button onClick={join} disabled={joinCode.length !== 4 || !name.trim()} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
        Join Lobby
      </button>
    </div>
  );
}
