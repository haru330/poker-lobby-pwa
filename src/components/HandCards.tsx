import { useRef, useState } from 'react';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import type { Card } from '../types';
import type { StrengthBar } from '../poker/presentation';

const SUIT_SYMBOLS: Record<Card['suit'], string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS: Card['suit'][] = ['hearts', 'diamonds'];

const PEEK_MS = 500;
const DETAIL_MS = 1000;

interface HandCardsProps {
  cards: Card[];
  description: string | null;
  strength: StrengthBar | null;
  onFold: () => void;
}

/**
 * The player's hole cards: hold to peek (circular timer -> flip reveal ->
 * hand-strength readout), drag to reposition, or drag-drop above the split
 * line to fold (tossed off-screen).
 */
export function HandCards({ cards, description, strength, onFold }: HandCardsProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [progress, setProgress] = useState(0);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const controls = useAnimation();

  function clearTimers() {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    if (detailTimer.current) clearTimeout(detailTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    peekTimer.current = null;
    detailTimer.current = null;
    progressTimer.current = null;
  }

  function onPointerDown() {
    const start = Date.now();
    progressTimer.current = setInterval(() => {
      setProgress(Math.min(1, (Date.now() - start) / PEEK_MS));
    }, 16);
    peekTimer.current = setTimeout(() => {
      setStage(1);
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
      setProgress(0);
    }, PEEK_MS);
    detailTimer.current = setTimeout(() => setStage(2), PEEK_MS + DETAIL_MS);
  }

  function reset() {
    clearTimers();
    setProgress(0);
    setStage(0);
  }

  async function onDragEnd(_: unknown, info: PanInfo) {
    const splitLineY = window.innerHeight * 0.3;
    if (info.point.y < splitLineY) {
      await controls.start({
        x: info.offset.x + (info.offset.x < 0 ? -600 : 600),
        y: info.offset.y - 200,
        rotate: info.offset.x < 0 ? -40 : 40,
        opacity: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
      });
      onFold();
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } });
    }
  }

  return (
    <motion.div
      className="pg-hand-wrap"
      drag
      dragMomentum={false}
      animate={controls}
      onPointerDown={onPointerDown}
      onPointerUp={reset}
      onPointerCancel={reset}
      onDragStart={reset}
      onDragEnd={onDragEnd}
    >
      {stage >= 1 && (
        <div className="pg-strength">
          {description ?? 'Reading hand…'}
          {stage >= 2 && strength && (
            <div className="pg-strength-bar">
              <div className="pg-strength-bar-fill" style={{ width: `${strength.percent}%`, background: strength.color }} />
            </div>
          )}
          {stage >= 2 && strength && <div style={{ marginTop: '0.2rem', opacity: 0.7 }}>{strength.verdict}</div>}
        </div>
      )}

      {cards.map((card, i) => {
        const isRed = RED_SUITS.includes(card.suit);
        return (
          <div
            className={`pg-card ${stage >= 1 ? 'pg-card--revealed' : ''} ${i === 1 ? 'pg-card--stacked' : ''}`}
            key={i}
            style={{ zIndex: i }}
          >
            <div className="pg-card-inner">
              <div className="pg-card-face pg-card-face--back" />
              <div className={`pg-card-face pg-card-face--front ${isRed ? 'pg-card-face--red' : ''}`}>
                <div>{card.rank}</div>
                <div className="pg-card-suit">{SUIT_SYMBOLS[card.suit]}</div>
              </div>
            </div>
            {progress > 0 && stage === 0 && i === 0 && (
              <svg className="pg-progress-ring" viewBox="0 0 48 48">
                <circle className="pg-progress-ring-bg" cx="24" cy="24" r="20" />
                <circle
                  className="pg-progress-ring-fg"
                  cx="24"
                  cy="24"
                  r="20"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - progress)}
                />
              </svg>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
