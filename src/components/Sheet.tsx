import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import '../styles/lobby.css';

interface SheetProps {
  expanded: boolean;
  variant?: 'paper' | 'blue' | 'orange' | 'dark';
  children: ReactNode;
}

/**
 * Persistent bottom sheet: collapsed shows only the title header (15vh),
 * expanded covers the full viewport. Used as the shell for every screen so
 * navigation feels like one card resizing rather than separate pages.
 */
export function Sheet({ expanded, variant = 'paper', children }: SheetProps) {
  return (
    <motion.div
      className={`pl-sheet pl-sheet--${variant}`}
      initial={{ y: '100%' }}
      animate={{ y: expanded ? '0%' : '85%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <div className="pl-sheet-header">
        <h1>Hold'em Stares</h1>
      </div>
      <div className="pl-sheet-body">{children}</div>
    </motion.div>
  );
}
