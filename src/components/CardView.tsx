import type { Card } from '../types';

const SUIT_SYMBOLS: Record<Card['suit'], string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS: Card['suit'][] = ['hearts', 'diamonds'];

export type CardHighlight = 'combo' | 'best' | undefined;

const HIGHLIGHT_COLORS: Record<'combo' | 'best', string> = {
  combo: '#2ecc71', // the defining cards of the hand (e.g. the pair, trips, straight run)
  best: '#3498db', // other cards that round out the best-5 (kickers)
};

export function CardView({ card, highlighted }: { card: Card; highlighted?: CardHighlight }) {
  const isRed = RED_SUITS.includes(card.suit);
  const color = highlighted ? HIGHLIGHT_COLORS[highlighted] : '#999';
  return (
    <span
      className="card-view"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.5rem',
        height: '3.5rem',
        border: highlighted ? `3px solid ${color}` : '1px solid #999',
        borderRadius: '6px',
        background: '#fff',
        color: isRed ? '#c0392b' : '#222',
        fontWeight: 'bold',
        fontSize: '1rem',
        margin: '0.15rem',
        boxShadow: highlighted ? `0 0 4px ${color}` : 'none',
      }}
    >
      {card.rank}
      {SUIT_SYMBOLS[card.suit]}
    </span>
  );
}

export function CardBack() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.5rem',
        height: '3.5rem',
        border: '1px solid #999',
        borderRadius: '6px',
        background: 'repeating-linear-gradient(45deg, #34495e, #34495e 4px, #2c3e50 4px, #2c3e50 8px)',
        margin: '0.15rem',
      }}
    />
  );
}
