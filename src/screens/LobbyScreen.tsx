import { useGameDispatch, useGameState } from '../state/GameContext';
import { useNetwork } from '../network/NetworkProvider';

const TOKEN_KEY = 'poker-lobby-session-token';

export function LobbyScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { leave } = useNetwork();
  const me = state.players.find((p) => p.id === localStorage.getItem(TOKEN_KEY));
  const isHost = me?.isHost ?? false;

  function leaveLobby() {
    leave();
    localStorage.removeItem(TOKEN_KEY);
    dispatch({ type: 'LEAVE_LOBBY' });
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 360, margin: '0 auto' }}>
      <h1>Lobby</h1>
      <p>
        Room code: <strong style={{ fontSize: '1.5rem', letterSpacing: '0.3em' }}>{state.roomCode}</strong>
      </p>

      <h3>Players ({state.players.length}/8)</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {state.players.map((p) => (
          <li key={p.id} style={{ padding: '0.25rem 0' }}>
            {p.name} {p.isHost ? '(Host)' : ''} — {p.status}
          </li>
        ))}
      </ul>

      {isHost && (
        <>
          <div style={{ margin: '1rem 0' }}>
            <label>
              Starting chips:{' '}
              <input
                type="number"
                value={state.startingChips}
                onChange={(e) => dispatch({ type: 'SET_STARTING_CHIPS', amount: Number(e.target.value) })}
                style={{ width: '80px' }}
              />
            </label>
          </div>

          <div style={{ margin: '1rem 0' }}>
            <label>
              Big blind:{' '}
              <input
                type="number"
                value={state.bigBlind}
                onChange={(e) => dispatch({ type: 'SET_BIG_BLIND', amount: Number(e.target.value) })}
                style={{ width: '80px' }}
              />
            </label>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Small blind: ${Math.floor(state.bigBlind / 2)}</p>
          </div>

          <button
            onClick={() => dispatch({ type: 'START_GAME' })}
            disabled={state.players.length < 2}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}
          >
            Start Game
          </button>
          {state.players.length < 2 && <p>Need at least 2 players to start.</p>}
        </>
      )}

      {!isHost && <p>Waiting for host to start the game...</p>}

      <button onClick={leaveLobby} style={{ width: '100%', padding: '0.5rem', marginTop: '1rem' }}>
        Leave Lobby
      </button>
    </div>
  );
}
