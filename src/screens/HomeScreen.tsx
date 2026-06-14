import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameDispatch } from '../state/GameContext';
import { generateRoomCode, generateSessionToken } from '../utils/roomCode';
import { createPlayer } from '../utils/player';
import { Sheet } from '../components/Sheet';
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

  const ready = joinCode.length === 4 && name.trim().length > 0;
  const expanded = step === 'join';

  return (
    <div className="pl-screen">
      {step === 'menu' && (
        <>
          <motion.button
            className="pl-coin pl-coin--join"
            initial={{ x: '-150%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 }}
            disabled={!name.trim()}
            onClick={() => setStep('join')}
          >
            Join
          </motion.button>
          <motion.button
            className="pl-coin pl-coin--host"
            initial={{ x: '150%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 }}
            disabled={!name.trim()}
            onClick={host}
          >
            Host
          </motion.button>
        </>
      )}

      <Sheet expanded={expanded} variant={expanded ? 'orange' : 'paper'}>
        {step === 'menu' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <input
              className="pl-input"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              style={{ marginBottom: '1rem' }}
            />
          </div>
        ) : (
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          </>
        )}
      </Sheet>
    </div>
  );
}
