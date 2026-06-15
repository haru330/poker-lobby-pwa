import { useRef } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { chipColor } from './PokerChip';

const DENOMS = [25, 10, 5, 1];
const PX_PER_CHIP = 16;
const RAISE_HOLD_MS = 400;
const DOUBLE_TAP_MS = 400;

/** Splits a chip total into stacks of at most 5, ordered left-to-right (1s -> 25s). */
function breakdown(total: number): { denom: number; count: number }[] {
  const stacks: { denom: number; count: number }[] = [];
  let remaining = Math.max(0, Math.round(total));
  for (const denom of DENOMS) {
    while (remaining >= denom) {
      const count = Math.min(5, Math.floor(remaining / denom));
      stacks.push({ denom, count });
      remaining -= count * denom;
    }
  }
  return stacks.sort((a, b) => a.denom - b.denom);
}

interface ChipStackProps {
  denom: number;
  count: number;
  onPanStart?: () => void;
  onPan?: (info: PanInfo, denom: number) => void;
}

function ChipStack({ denom, count, onPanStart, onPan }: ChipStackProps) {
  const { bg, fg } = chipColor(denom);
  return (
    <motion.div
      className="pg-chip-stack"
      onPanStart={onPanStart}
      onPan={(_, info) => onPan?.(info, denom)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="pg-chip-disc" style={{ background: bg, borderColor: fg }} />
      ))}
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
  const baseStacks = breakdown(Math.max(0, chips - betAmount));
  const stagedStacks = breakdown(betAmount);

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
        {baseStacks.map((s, i) => (
          <ChipStack key={`base-${s.denom}-${i}`} denom={s.denom} count={s.count} onPanStart={handlePanStart} onPan={handlePan} />
        ))}
      </div>

      {betAmount > 0 && (
        <motion.div
          className="pg-chip-rack pg-chip-rack--staged"
          style={{ top: '20%' }}
          drag
          dragElastic={0.2}
          dragMomentum={false}
          dragSnapToOrigin
          onDrag={handleStagedDrag}
          onDragEnd={handleStagedDragEnd}
        >
          {stagedStacks.map((s, i) => (
            <ChipStack key={`staged-${s.denom}-${i}`} denom={s.denom} count={s.count} />
          ))}
        </motion.div>
      )}
    </>
  );
}
