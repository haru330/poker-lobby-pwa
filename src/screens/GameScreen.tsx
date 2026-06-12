import { useState } from 'react';
import { useGameDispatch, useGameState } from '../state/GameContext';
import { useNetwork } from '../network/NetworkProvider';
import { CardView, CardBack, type CardHighlight } from '../components/CardView';
import { evaluateHand } from '../poker/evaluator';
import { describeHand, strengthBar, preflopStrength, boardConcerns } from '../poker/presentation';
import type { ActionType } from '../types';

const TOKEN_KEY = 'poker-lobby-session-token';

export function GameScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { sendAction, leave } = useNetwork();
  const myId = localStorage.getItem(TOKEN_KEY);
  const me = state.players.find((p) => p.id === myId);
  const isHost = me?.isHost ?? false;
  const isMyTurn = state.currentTurnPlayerId === myId;
  const [raiseAmount, setRaiseAmount] = useState(state.bigBlind * 2);

  function proposeAction(type: ActionType) {
    if (!myId) return;
    sendAction({ playerId: myId, type, amount: type === 'raise' ? raiseAmount : undefined });
  }

  function leaveGame() {
    leave();
    localStorage.removeItem(TOKEN_KEY);
    dispatch({ type: 'LEAVE_LOBBY' });
  }

  const totalPot = state.pots.reduce((sum, p) => sum + p.amount, 0);

  const myEvaluation =
    me && me.hand.length > 0 ? evaluateHand([...me.hand, ...state.communityCards]) : null;
  const myConcerns = myEvaluation ? boardConcerns(myEvaluation, state.communityCards) : [];
  const myBar = myEvaluation
    ? state.street === 'preflop' && me
      ? preflopStrength(me.hand)
      : strengthBar(myEvaluation)
    : null;
  const cardKey = (c: { rank: string; suit: string }) => `${c.rank}-${c.suit}`;
  const comboCardSet = new Set(myEvaluation?.comboCards.map(cardKey) ?? []);
  const bestCardSet = new Set(
    myEvaluation && myEvaluation.cards.length === 5 ? myEvaluation.cards.map(cardKey) : [],
  );
  function highlightFor(c: { rank: string; suit: string }): CardHighlight {
    const key = cardKey(c);
    if (comboCardSet.has(key)) return 'combo';
    if (bestCardSet.has(key)) return 'best';
    return undefined;
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 480, margin: '0 auto' }}>
      <h1>Table</h1>
      <p style={{ textAlign: 'center', textTransform: 'capitalize' }}>{state.street}</p>

      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <h3>Community Cards</h3>
        {state.communityCards.map((c, i) => (
          <CardView key={i} card={c} highlighted={highlightFor(c)} />
        ))}
      </div>

      <p style={{ textAlign: 'center' }}>
        Pot: ${totalPot} (BB: ${state.bigBlind} / SB: ${Math.floor(state.bigBlind / 2)})
      </p>

      {state.pots.length > 1 && (
        <div style={{ margin: '0.5rem 0' }}>
          <h4>Side Pots</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {state.pots.map((p, i) => (
              <li key={p.id}>
                Pot {i + 1}: ${p.amount} — eligible:{' '}
                {p.eligiblePlayerIds
                  .map((id) => state.players.find((pl) => pl.id === id)?.name)
                  .join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {myEvaluation && (
        <div style={{ margin: '1rem 0', padding: '0.5rem', borderRadius: '6px', background: '#f7f7f7' }}>
          <h3>Your Hand: {describeHand(myEvaluation)}</h3>
          {myBar && (
            <>
              <div style={{ background: '#ddd', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${myBar.percent}%`, background: myBar.color, height: '100%' }} />
              </div>
              <p>Verdict: {myBar.verdict}</p>
            </>
          )}
          {myConcerns.map((c) => (
            <p key={c} style={{ fontSize: '0.85rem', color: '#666' }}>
              {c}
            </p>
          ))}
        </div>
      )}

      <h3>Players</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {state.players.map((p, i) => (
          <li
            key={p.id}
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              borderRadius: '6px',
              border: p.id === state.currentTurnPlayerId ? '2px solid #2ecc71' : '1px solid #ccc',
              opacity: p.hasFolded || p.status === 'disconnected' ? 0.5 : 1,
            }}
          >
            <strong>
              {p.name} {p.isHost ? '(Host)' : ''} {p.id === myId ? '(You)' : ''}
              {i === state.dealerButtonIndex ? ' [D]' : ''}
            </strong>
            <div>Chips: ${p.chips}</div>
            <div>Bet this street: ${p.streetContribution}</div>
            {p.hasFolded && <div>Folded</div>}
            {p.isAllIn && <div>All-in</div>}
            {p.status === 'disconnected' && <div>Disconnected</div>}
            <div>
              {p.id === myId || (state.street === 'showdown' && !p.hasFolded)
                ? p.hand.map((c, ci) => (
                    <CardView key={ci} card={c} highlighted={p.id === myId ? highlightFor(c) : undefined} />
                  ))
                : p.hand.map((_, ci) => <CardBack key={ci} />)}
            </div>
          </li>
        ))}
      </ul>

      {state.actionLog.length > 0 && (
        <div style={{ margin: '1rem 0' }}>
          <h3>Action Log</h3>
          <ul style={{ listStyle: 'none', padding: 0, maxHeight: '150px', overflowY: 'auto' }}>
            {state.actionLog.map((entry) => (
              <li key={entry.id} style={{ fontSize: '0.9rem', color: '#444' }}>
                {entry.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.results && (
        <div style={{ padding: '0.5rem', background: '#eafaf1', borderRadius: '6px' }}>
          <h3>Hand Results</h3>
          {state.results.map((result) => (
            <div key={result.potId}>
              {result.winners.map((w) => {
                const p = state.players.find((pl) => pl.id === w.playerId);
                return (
                  <div key={w.playerId}>
                    {p?.name} wins ${w.amount} ({w.handDescription})
                  </div>
                );
              })}
              {result.tiebreakNote && (
                <div style={{ fontSize: '0.85rem', color: '#666' }}>Won on: {result.tiebreakNote}</div>
              )}
            </div>
          ))}
          {isHost && (
            <button onClick={() => dispatch({ type: 'NEXT_HAND' })} style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}>
              Next Hand
            </button>
          )}
        </div>
      )}

      {isMyTurn && !state.pendingAction && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Your Turn</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="number"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              style={{ width: '80px' }}
            />
            <button onClick={() => proposeAction('raise')}>Raise to</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {me && me.streetContribution < state.currentBet ? (
              <button onClick={() => proposeAction('call')}>
                Call ${Math.min(state.currentBet - me.streetContribution, me.chips)}
              </button>
            ) : (
              <button onClick={() => proposeAction('check')}>Check</button>
            )}
            <button onClick={() => proposeAction('fold')}>Fold</button>
          </div>
        </div>
      )}

      {isHost && state.pendingAction && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fff8e1', borderRadius: '6px' }}>
          <h3>Pending Action</h3>
          <p>
            {state.players.find((p) => p.id === state.pendingAction!.playerId)?.name} wants to{' '}
            {state.pendingAction.type}
            {state.pendingAction.type === 'raise' && (
              <>
                {' to $'}
                <input
                  type="number"
                  value={state.pendingAction.amount ?? 0}
                  onChange={(e) => dispatch({ type: 'EDIT_PENDING_ACTION', amount: Number(e.target.value) })}
                  style={{ width: '80px' }}
                />
              </>
            )}
          </p>
          <button onClick={() => dispatch({ type: 'CONFIRM_PENDING_ACTION' })}>Confirm</button>
          <button onClick={() => dispatch({ type: 'REJECT_PENDING_ACTION' })}>Reject</button>
        </div>
      )}

      <button onClick={leaveGame} style={{ width: '100%', padding: '0.5rem', marginTop: '1rem' }}>
        Leave Game
      </button>
    </div>
  );
}
