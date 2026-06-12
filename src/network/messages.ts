import type { Action, GameState } from '../types';

export type NetworkMessage =
  | { type: 'JOIN'; name: string; sessionToken: string }
  | { type: 'JOIN_REJECTED'; reason: string }
  | { type: 'ACTION'; action: Action }
  | { type: 'STATE'; state: GameState };
