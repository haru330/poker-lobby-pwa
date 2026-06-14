// Standard poker chip denomination colors (placeholder until real chip art).
const CHIP_COLORS: { value: number; bg: string; fg: string }[] = [
  { value: 1, bg: '#f5f5f5', fg: '#2b2a28' },
  { value: 5, bg: '#c0392b', fg: '#fff' },
  { value: 10, bg: '#2e6da4', fg: '#fff' },
  { value: 25, bg: '#2e8b57', fg: '#fff' },
  { value: 50, bg: '#7d3c98', fg: '#fff' },
  { value: 100, bg: '#1c1b19', fg: '#fff' },
];

export function chipColor(value: number): { bg: string; fg: string } {
  let match = CHIP_COLORS[0];
  for (const c of CHIP_COLORS) {
    if (value >= c.value) match = c;
  }
  return { bg: match.bg, fg: match.fg };
}

/** Side-view stack of chips: height (1-6 chips) reflects how far `value` sits between `min` and `max`. */
export function PokerChip({ value, min, max }: { value: number; min: number; max: number }) {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const count = Math.min(6, Math.max(1, Math.round(1 + ratio * 5)));
  const { bg, fg } = chipColor(value);
  return (
    <div key={count} className="pl-chip-stack pl-chip-drop">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="pl-chip-edge" style={{ background: bg, borderColor: fg }} />
      ))}
    </div>
  );
}
