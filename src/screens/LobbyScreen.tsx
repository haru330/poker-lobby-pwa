import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useGameDispatch, useGameState } from '../state/GameContext';
import { useNetwork } from '../network/NetworkProvider';
import { PokerChip } from '../components/PokerChip';
import { GearIcon, CheckIcon } from '../components/icons';
import '../styles/lobby.css';

const TOKEN_KEY = 'poker-lobby-session-token';

export function LobbyScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { leave } = useNetwork();
  const me = state.players.find((p) => p.id === localStorage.getItem(TOKEN_KEY));
  const isHost = me?.isHost ?? false;
  const host = state.players.find((p) => p.isHost);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);

  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${state.roomCode}`;

  useEffect(() => {
    // Transparent background, deep-blue modules to match the lobby card.
    QRCode.toDataURL(joinUrl, { width: 200, margin: 1, color: { dark: '#16324fff', light: '#00000000' } }).then(setQrDataUrl);
  }, [joinUrl]);

  function leaveLobby() {
    leave();
    localStorage.removeItem(TOKEN_KEY);
    dispatch({ type: 'LEAVE_LOBBY' });
  }

  return (
    <div className="pl-screen">
      <div className={`pl-flip-container pl-card2 ${flipped ? 'pl-card2--dark' : 'pl-card2--blue'} ${flipped ? 'flipped' : ''}`}>
        <div className="pl-flip-inner" style={{ height: '100%' }}>
          {/* Front: room info / QR / start */}
          <div className="pl-flip-face" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1>Hold'em Stares</h1>
            <p style={{ textAlign: 'center', margin: '0 0 0.25rem', fontSize: '0.85rem' }}>Room code</p>
            <p style={{ textAlign: 'center', margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.3em' }}>
              {state.roomCode}
            </p>

            {qrDataUrl && (
              <div className="pl-qr-frame">
                <img src={qrDataUrl} alt="Scan to join" style={{ width: 140, height: 140, display: 'block' }} />
              </div>
            )}

            <p style={{ textAlign: 'center', margin: '0.5rem 0', fontWeight: 700, color: '#1b5e20' }}>
              {host?.name} (Host)
            </p>

            {state.players
              .filter((p) => !p.isHost)
              .map((p) => (
                <p key={p.id} style={{ textAlign: 'center', margin: '0.15rem 0', color: '#1b5e20' }}>
                  {p.name} — joined
                </p>
              ))}

            {state.players.length < 2 && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>Need at least 2 players to start.</p>
            )}

            <div style={{ flex: 1 }} />

            {isHost && (
              <button
                className="pl-button pl-button--start"
                disabled={state.players.length < 2}
                onClick={() => dispatch({ type: 'START_GAME' })}
              >
                start game
              </button>
            )}

            {isHost && (
              <button
                className="pl-round-button"
                aria-label="Settings"
                onClick={() => setFlipped(true)}
                style={{ position: 'absolute', right: '1rem', bottom: '1rem' }}
              >
                <GearIcon />
              </button>
            )}
          </div>

          {/* Back: host settings */}
          {isHost && (
            <div className="pl-flip-face pl-flip-face--back" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <SettingsPanel />
              <button
                className="pl-round-button"
                aria-label="Back"
                onClick={() => setFlipped(false)}
                style={{ position: 'absolute', right: '1rem', bottom: '1rem' }}
              >
                <CheckIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isHost && <p style={{ textAlign: 'center', marginTop: '1rem', color: '#efe6d3' }}>Waiting for host to start the game...</p>}

      <button className="pl-button" onClick={leaveLobby} style={{ position: 'fixed', bottom: '1rem', left: '1.5rem', right: '1.5rem', maxWidth: 288 - 40, margin: '0 auto' }}>
        Leave Lobby
      </button>
    </div>
  );
}

function SettingsPanel() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <div>
      <p style={{ fontWeight: 700, margin: '0 0 0.25rem' }}>starting chips</p>
      <div className="pl-chip-row">
        <PokerChip value={state.startingChips} />
        <input
          className="pl-slider"
          type="range"
          min={50}
          max={500}
          step={50}
          value={state.startingChips}
          onChange={(e) => dispatch({ type: 'SET_STARTING_CHIPS', amount: Number(e.target.value) })}
        />
        <span>{state.startingChips} chips</span>
      </div>

      <p style={{ fontWeight: 700, margin: '0 0 0.25rem' }}>Big/small blind</p>
      <div className="pl-chip-row">
        <PokerChip value={state.bigBlind} />
        <input
          className="pl-slider"
          type="range"
          min={1}
          max={20}
          step={1}
          value={state.bigBlind}
          onChange={(e) => dispatch({ type: 'SET_BIG_BLIND', amount: Number(e.target.value) })}
        />
        <span>{state.bigBlind} chips</span>
      </div>

      <p style={{ fontWeight: 700, margin: '0 0 0.25rem' }}>Actual bet</p>
      <div className="pl-chip-row">
        <PokerChip value={state.realMoneyPerChips.amount} />
        <input
          className="pl-slider"
          type="range"
          min={1}
          max={20}
          step={1}
          value={state.realMoneyPerChips.amount}
          onChange={(e) =>
            dispatch({ type: 'SET_REAL_MONEY_PER_CHIPS', chips: state.realMoneyPerChips.chips, amount: Number(e.target.value) })
          }
        />
        <span>{state.realMoneyPerChips.amount} EUR</span>
      </div>
    </div>
  );
}
