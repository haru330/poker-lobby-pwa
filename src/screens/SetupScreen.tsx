import { useState } from 'react';
import { useGameDispatch } from '../state/GameContext';

const NAME_KEY = 'poker-lobby-username';

export function SetupScreen() {
  const dispatch = useGameDispatch();
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '');

  function handleContinue() {
    if (!name.trim()) return;
    localStorage.setItem(NAME_KEY, name.trim());
    dispatch({ type: 'SET_PHASE', phase: 'home' });
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 360, margin: '0 auto' }}>
      <h1>Poker Lobby</h1>
      <p>Make sure you're on the same wifi as the host, then enter your name.</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
      />
      <button onClick={handleContinue} disabled={!name.trim()} style={{ marginTop: '1rem', width: '100%', padding: '0.5rem' }}>
        Continue
      </button>
    </div>
  );
}
