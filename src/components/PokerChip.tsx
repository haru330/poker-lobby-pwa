// Standard poker chip denominations, matched to Hold'em Stares chip art.
const CHIP_DENOMS = [1, 5, 10, 25, 50, 100];

export function chipDenom(value: number): number {
  let match = CHIP_DENOMS[0];
  for (const d of CHIP_DENOMS) {
    if (value >= d) match = d;
  }
  return match;
}

export function PokerChip({ value }: { value: number }) {
  const denom = chipDenom(value);
  return (
    <img
      key={value}
      className="pl-chip pl-chip-drop"
      src={`/assets/holdem/chip_${denom}.svg`}
      alt={`${denom} chip`}
    />
  );
}
