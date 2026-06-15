import { useState } from 'react';
import { useGameDispatch, useGameState } from '../state/GameContext';
import { useNetwork } from '../network/NetworkProvider';
import { SectionNav } from '../components/SectionNav';
import { ChipRack } from '../components/ChipRack';
import { HandCards } from '../components/HandCards';
import { ExitIcon } from '../components/icons';
import { evaluateHand } from '../poker/evaluator';
import { describeHand, strengthBar, preflopStrength } from '../poker/presentation';
import '../styles/lobby.css';
import '../styles/game.css';

const TOKEN_KEY = 'poker-lobby-session-token';

export function GameScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { sendAction, leave } = useNetwork();
  const myId = localStorage.getItem(TOKEN_KEY);
  const me = state.players.find((p) => p.id === myId);
  const isMyTurn = state.currentTurnPlayerId === myId;

  const [section, setSection] = useState(2);
  const [betAmount, setBetAmount] = useState(0);

  function leaveGame() {
    leave();
    localStorage.removeItem(TOKEN_KEY);
    dispatch({ type: 'LEAVE_LOBBY' });
  }

  function proposeAction(type: 'raise' | 'call' | 'check' | 'fold', amount?: number) {
    if (!myId) return;
    sendAction({ playerId: myId, type, amount });
    setBetAmount(0);
  }

  const myEvaluation = me && me.hand.length > 0 ? evaluateHand([...me.hand, ...state.communityCards]) : null;
  const myBar = myEvaluation
    ? state.street === 'preflop' && me
      ? preflopStrength(me.hand)
      : strengthBar(myEvaluation)
    : null;
  const description = myEvaluation ? describeHand(myEvaluation) : null;

  const callAmount = me ? Math.max(0, Math.min(state.currentBet - me.streetContribution, me.chips)) : 0;
  const canCheck = isMyTurn && callAmount === 0;

  return (
    <div className="pg-screen">
      <SectionNav active={section} onChange={setSection} notify={isMyTurn ? [2] : []} />

      <div
        className="pg-sections"
        style={{
          transform: `translateY(-${section * 100}vh)`,
          transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="pg-section pg-section--top" />
        <div className="pg-section pg-section--middle" />
        <div className="pg-section pg-section--bottom">
          <button
            className="pl-round-button"
            aria-label="Leave game"
            onClick={leaveGame}
            style={{ position: 'absolute', left: '1rem', top: '1rem', zIndex: 10 }}
          >
            <ExitIcon />
          </button>

          <div className="pg-split-line" />

          {me && (
            <ChipRack
              chips={me.chips}
              betAmount={betAmount}
              onBetChange={setBetAmount}
              callAmount={callAmount}
              canCheck={canCheck}
              onRaise={(amount) => proposeAction('raise', me.streetContribution + amount)}
              onCheck={() => proposeAction('check')}
            />
          )}

          {me && (
            <HandCards
              cards={me.hand}
              description={description}
              strength={myBar}
              onFold={() => proposeAction('fold')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
