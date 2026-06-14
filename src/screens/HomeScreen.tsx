import { useState } from 'react';
import { useGameDispatch } from '../state/GameContext';
import { generateRoomCode, generateSessionToken } from '../utils/roomCode';
import { createPlayer } from '../utils/player';
import '../styles/lobby.css';

const NAME_KEY = 'poker-lobby-username';
const TOKEN_KEY = 'poker-lobby-session-token';

type Step = 'menu' | 'join';

export function HomeScreen() {
  const dispatch = useGameDispatch();
  const [name, setName] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('room');
    return localStorage.getItem(NAME_KEY) ?? (fromUrl ? '' : 'Player');
  });
  const [step, setStep] = useState<Step>('menu');
  const [joinCode, setJoinCode] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('room');
    return fromUrl ? fromUrl.toUpperCase().slice(0, 4) : '';
  });
  const [leaving, setLeaving] = useState(false);

  function updateName(value: string) {
    setName(value);
    localStorage.setItem(NAME_KEY, value);
  }

  function host() {
    setLeaving(true);
    setTimeout(() => {
      const roomCode = generateRoomCode();
      const sessionToken = generateSessionToken();
      localStorage.setItem(TOKEN_KEY, sessionToken);

      dispatch({ type: 'SET_ROOM_CODE', roomCode });
      dispatch({ type: 'ADD_PLAYER', player: createPlayer(sessionToken, name, 100, true) });
      dispatch({ type: 'SET_PHASE', phase: 'lobby' });
    }, 300);
  }

  function join() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) return;
    setLeaving(true);
    setTimeout(() => {
      if (!localStorage.getItem(TOKEN_KEY)) {
        localStorage.setItem(TOKEN_KEY, generateSessionToken());
      }

      // The NetworkProvider connects to the host (room code = host's peer ID)
      // and sends a JOIN message once roomCode + phase are set; the host's
      // broadcast then populates our player list.
      dispatch({ type: 'SET_ROOM_CODE', roomCode: code });
      dispatch({ type: 'SET_PHASE', phase: 'lobby' });
    }, 300);
  }

  const ready = joinCode.length === 4 && name.trim().length > 0;

  return (
    <div className="pl-screen">
      <div className="pl-stack">
        <div className="pl-card-back pl-card--blue" />

        {step === 'menu' ? (
          <div className={`pl-card pl-card--skin pl-card--skin-box ${leaving ? 'pl-card-leaving' : ''}`}>
            <div style={{ flex: 1.6 }} />
            <div style={{ padding: '0 2rem 0.75rem' }}>
              <input
                className="pl-input"
                value={name}
                onChange={(e) => updateName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
                style={{ marginBottom: '1.25rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                <button className="pl-button pl-button--join" disabled={!name.trim()} onClick={() => setStep('join')}>
                  Join
                </button>
                <button className="pl-button pl-button--host" disabled={!name.trim()} onClick={host}>
                  Host
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`pl-card pl-card--skin pl-card--skin-join pl-card-entering ${leaving ? 'pl-card-leaving' : ''}`}>
            <div style={{ flex: 1 }} />
            <div style={{ padding: '0 1.5rem' }}>
              <input
                className="pl-code-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="____"
                maxLength={4}
              />
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.5rem 1.5rem' }}>
              <button className="pl-button" onClick={() => setStep('menu')} style={{ flex: '0 0 auto' }}>
                Back
              </button>
              <button
                className={`pl-button pl-button--confirm ${ready ? 'pl-ready' : ''}`}
                disabled={!ready}
                onClick={join}
              >
                Join Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
