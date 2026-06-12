import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { gameReducer, initialGameState, type GameAction } from './gameReducer';
import type { GameState } from '../types';

const STORAGE_KEY = 'poker-lobby-state';

function loadInitialState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialGameState, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt storage
  }
  return initialGameState;
}

const GameStateContext = createContext<GameState>(initialGameState);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadInitialState);

  // Host persists full state to localStorage on every change (see CONTEXT.md: Host).
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>{children}</GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameState {
  return useContext(GameStateContext);
}

export function useGameDispatch(): Dispatch<GameAction> {
  const dispatch = useContext(GameDispatchContext);
  if (!dispatch) throw new Error('useGameDispatch must be used within GameProvider');
  return dispatch;
}
