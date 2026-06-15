import { motion, type PanInfo } from 'framer-motion';

const SEGMENT_HEIGHT = 60;
const THUMB_HEIGHT = 56;
const SECTION_COUNT = 3;

interface SectionNavProps {
  active: number;
  onChange: (index: number) => void;
  notify?: number[];
}

/**
 * Right-edge vertical nav bar: press & hold the thumb and drag to snap the
 * view between the top/middle/bottom sections. Each segment also doubles as
 * a notification dot for activity happening in that section.
 */
export function SectionNav({ active, onChange, notify = [] }: SectionNavProps) {
  const maxY = (SECTION_COUNT - 1) * SEGMENT_HEIGHT;

  function onDragEnd(_: unknown, info: PanInfo) {
    const y = active * SEGMENT_HEIGHT + info.offset.y;
    const index = Math.min(SECTION_COUNT - 1, Math.max(0, Math.round(y / SEGMENT_HEIGHT)));
    onChange(index);
  }

  return (
    <div className="pg-nav">
      {Array.from({ length: SECTION_COUNT }).map((_, i) => (
        <div className="pg-nav-segment" key={i}>
          <div className={`pg-nav-dot ${notify.includes(i) && i !== active ? 'pg-nav-dot--notify' : ''}`} />
        </div>
      ))}
      <motion.div
        className="pg-nav-thumb"
        drag="y"
        dragConstraints={{ top: 0, bottom: maxY }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        animate={{ top: active * SEGMENT_HEIGHT + (SEGMENT_HEIGHT - THUMB_HEIGHT) / 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      />
    </div>
  );
}
