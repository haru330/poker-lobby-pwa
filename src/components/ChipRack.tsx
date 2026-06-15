import { useRef } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { chipColor } from './PokerChip';

const DENOMS = [1, 5, 10, 25];
const MAX_VISUAL_DISCS = 6;
const PX_PER_CHIP = 16;
const RAISE_HOLD_MS = 400;
const DOUBLE_TAP_MS = 400;

/** Greedily breaks a chip total into one count per denomination, largest-first. */
function denomCounts(total: number): number[] {
  let remaining = Math.max(0, Math.round(total));
  const counts = new Array(DENOMS.length).fill(0);
  for (let i = DENOMS.length - 1; i >= 0; i--) {
    counts[i] = Math.floor(remaining / DENOMS[i]);
    remaining -= counts[i] * DENOMS[i];
  }
  return counts;
}

interface ChipStackProps {
  denom: number;
  count: number;
  onPanStart?: () => void;
  onPan?: (info: PanInfo, denom: number) => void;
}

function ChipStack({ denom, count, onPanStart, onPan }: ChipStackProps) {
  const { bg, fg } = chipColor(denom);
  const visible = Math.min(MAX_VISUAL_DISCS, count);
  return (
    <motion.div
      className="pg-chip-stack"
      onPanStart={onPanStart}
      onPan={(_, info) => onPan?.(info, denom)}
    >
      {visible > 0 ? (
        Array.from({ length: visible }).map((_, i) => (
          <span key={i} className="pg-chip-disc" style={{ background: bg, borderColor: fg }} />
        ))
      ) : (
        <span className="pg-chip-disc pg-chip-disc--empty" style={{ background: bg, borderColor: fg }} />
      )}
    </motion.div>
  );
}

interface ChipRackProps {
  chips: number;
  betAmount: number;
  onBetChange: (amount: number) => void;
  callAmount: number;
  canCheck: boolean;
  onRaise: (amount: number) => void;
  onCheck: () => void;
}

/**
 * Chip rack for the bottom section: drag a stack up/down to size a bet,
 * swipe the staged stack left to auto-fill the call amount, or drag it down
 * past the split line and hold to raise. Double-tapping the table checks.
 */
export function ChipRack({ chips, betAmount, onBetChange, callAmount, canCheck, onRaise, onCheck }: ChipRackProps) {
  const baseCounts = denomCounts(Math.max(0, chips - betAmount));
  const stagedCounts = denomCounts(betAmount);

  const panStartBetRef = useRef(betAmount);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);

  function handlePanStart() {
    panStartBetRef.current = betAmount;
  }

  function handlePan(info: PanInfo, denom: number) {
    const steps = Math.round(-info.offset.y / PX_PER_CHIP);
    const next = Math.min(chips, Math.max(0, panStartBetRef.current + steps * denom));
    onBetChange(next);
  }

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function handleStagedDrag(_: unknown, info: PanInfo) {
    const splitLineY = window.innerHeight * 0.3;
    if (info.point.y > splitLineY) {
      if (!holdTimerRef.current && betAmount > 0) {
        holdTimerRef.current = setTimeout(() => {
          onRaise(betAmount);
          holdTimerRef.current = null;
        }, RAISE_HOLD_MS);
      }
    } else {
      clearHoldTimer();
    }
  }

  function handleStagedDragEnd(_: unknown, info: PanInfo) {
    clearHoldTimer();
    // Swipe left across the chips -> auto-fill the call amount.
    if (info.offset.x < -60 && Math.abs(info.offset.y) < 60 && callAmount > 0) {
      onBetChange(callAmount);
    }
  }

  function handleTableTap() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      if (canCheck) onCheck();
    } else {
      lastTapRef.current = now;
    }
  }

  return (
    <>
      <div className="pg-table-area" onPointerDown={handleTableTap} />

      {betAmount > 0 && <div className="pg-bet-label">Bet: ${betAmount}</div>}

      <div className="pg-chip-rack">
        {DENOMS.map((denom, i) => (
          <ChipStack key={denom} denom={denom} count={baseCounts[i]} onPanStart={handlePanStart} onPan={handlePan} />
        ))}
      </div>

      {betAmount > 0 && (
        <motion.div
          className="pg-chip-rack pg-chip-rack--staged"
          drag
          dragElastic={0.2}
          dragMomentum={false}
          dragSnapToOrigin
          onDrag={handleStagedDrag}
          onDragEnd={handleStagedDragEnd}
        >
          {DENOMS.map((denom, i) => (
            <ChipStack key={denom} denom={denom} count={stagedCounts[i]} />
          ))}
        </motion.div>
      )}
    </>
  );
}
