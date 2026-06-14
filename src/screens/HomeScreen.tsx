import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { useGameDispatch } from '../state/GameContext';
import { generateRoomCode, generateSessionToken } from '../utils/roomCode';
import { createPlayer } from '../utils/player';
import '../styles/lobby.css';

const NAME_KEY = 'poker-lobby-username';
const TOKEN_KEY = 'poker-lobby-session-token';

type Step = 'start' | 'join';

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
  const [step, setStep] = useState<Step>('start');
  const [holding, setHolding] = useState(false);

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
    setHolding(false);
    const lineY = window.innerHeight * 0.65;
    if (info.point.y >= lineY) return; // dropped back on the home zone — snap back
    if (info.point.x < window.innerWidth / 2) {
      setStep('join');
    } else {
      host();
    }
  }

  const ready = joinCode.length === 4 && name.trim().length > 0;

  if (step === 'join') {
    return (
      <div className="pl-screen">
        <div className="pl-card2 pl-card2--orange">
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
            <button className="pl-button" onClick={() => setStep('start')} style={{ flex: '0 0 auto' }}>
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
      </div>
    );
  }

  return (
    <div className="pl-screen pl-screen--table">
      <div className="pl-table-line" />
      <div className={`pl-drop-zone pl-drop-zone--join ${holding ? 'pl-drop-zone--visible' : ''}`} />
      <div className={`pl-drop-zone pl-drop-zone--host ${holding ? 'pl-drop-zone--visible' : ''}`} />
      <div className={`pl-drop-zone pl-drop-zone--home ${holding ? 'pl-drop-zone--visible' : ''}`} />

      <motion.div
        className="pl-hs-card"
        drag
        dragSnapToOrigin
        dragElastic={0.2}
        onDragStart={() => setHolding(true)}
        onDragEnd={onDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        <h1>Hold'em Stares</h1>
        <input
          className="pl-input"
          value={name}
          onChange={(e) => updateName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
        />
        <p className="pl-hint">hold &amp; drag — left to join, right to host</p>
      </motion.div>
    </div>
  );
}
