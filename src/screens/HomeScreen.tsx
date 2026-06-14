import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { useGameDispatch } from '../state/GameContext';
import { generateRoomCode, generateSessionToken } from '../utils/roomCode';
import { createPlayer } from '../utils/player';
import '../styles/lobby.css';

const NAME_KEY = 'poker-lobby-username';
const TOKEN_KEY = 'poker-lobby-session-token';

type Phase = 'start' | 'picking' | 'join';

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
  const [phase, setPhase] = useState<Phase>('start');

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

  function onDragEnd(_: unknown, info: PanInfo) {
    if (phase === 'start' && info.offset.y > 100) {
      setPhase('picking');
    } else if (phase === 'picking') {
      if (info.offset.x > 70) host();
      else if (info.offset.x < -70) setPhase('join');
    }
  }

  const ready = joinCode.length === 4 && name.trim().length > 0;

  return (
    <div className="pl-screen pl-screen--table">
      <div className="pl-table-line" />

      <motion.div
        layout
        className={`pl-hs-card ${phase === 'start' ? 'pl-hs-card--start' : 'pl-hs-card--center'}`}
        drag={phase === 'start' ? 'y' : phase === 'picking' ? 'x' : false}
        dragElastic={0.15}
        dragSnapToOrigin
        dragConstraints={phase === 'picking' ? { left: -140, right: 140 } : undefined}
        onDragEnd={onDragEnd}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {phase === 'start' && (
          <>
            <h1>Hold'em Stares</h1>
            <p className="pl-hint">drag the card down to the table</p>
          </>
        )}

        {phase === 'picking' && (
          <>
            <h1>Hold'em Stares</h1>
            <input
              className="pl-input"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
            />
            <p className="pl-hint">drag right to host · left to join</p>
          </>
        )}

        {phase === 'join' && (
          <>
            <p style={{ margin: '0.5rem 0', textAlign: 'center', fontWeight: 700, letterSpacing: '0.2em' }}>
              ENTER ROOM CODE
            </p>
            <input
              className="pl-code-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="____"
              maxLength={4}
            />
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button className="pl-button" onClick={() => setPhase('picking')} style={{ flex: '0 0 auto' }}>
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
      </motion.div>
    </div>
  );
}
