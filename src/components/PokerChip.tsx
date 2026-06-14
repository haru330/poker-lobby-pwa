// Standard poker chip denomination colors.
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

export function PokerChip({ value }: { value: number }) {
  const { bg, fg } = chipColor(value);
  return (
    <span key={value} className="pl-chip pl-chip-drop" style={{ background: bg, color: fg }}>
      {value}
    </span>
  );
}
