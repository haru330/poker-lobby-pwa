import type { Player } from '../types';

export function createPlayer(id: string, name: string, chips: number, isHost: boolean): Player {
  return {
    id,
    name,
    chips,
    hand: [],
    status: 'connected',
    hasFolded: false,
    isAllIn: false,
    isHost,
    streetContribution: 0,
    totalContribution: 0,
    hasActed: false,
  };
}
