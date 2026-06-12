import type { Action, GameState, Player, PendingAction } from '../types';
import { dealNewHand, applyAction } from '../poker/engine';

export const initialGameState: GameState = {
  roomCode: '',
  phase: 'setup',
  players: [],
  deck: [],
  communityCards: [],
  street: 'preflop',
  pots: [],
  dealerButtonIndex: -1,
  currentTurnPlayerId: null,
  currentBet: 0,
  minRaise: 0,
  pendingAction: null,
  startingChips: 100,
  bigBlind: 2,
  actionLog: [],
  results: null,
};

export type GameAction =
  | { type: 'SET_ROOM_CODE'; roomCode: string }
  | { type: 'SET_PHASE'; phase: GameState['phase'] }
  | { type: 'SET_STARTING_CHIPS'; amount: number }
  | { type: 'SET_BIG_BLIND'; amount: number }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'SET_PLAYER_STATUS'; playerId: string; status: Player['status'] }
  | { type: 'START_GAME' }
  | { type: 'NEXT_HAND' }
  | { type: 'PROPOSE_ACTION'; action: Action; id: string }
  | { type: 'EDIT_PENDING_ACTION'; amount: number }
  | { type: 'CONFIRM_PENDING_ACTION' }
  | { type: 'REJECT_PENDING_ACTION' }
  | { type: 'REPLACE_STATE'; state: GameState }
  | { type: 'PROMOTE_TO_HOST'; newHostId: string; removePlayerId: string }
  | { type: 'LEAVE_LOBBY' };

function stripSuffix(name: string): string {
  return name.replace(/ \([AB]\)$/, '');
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.roomCode };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_STARTING_CHIPS':
      return { ...state, startingChips: action.amount };

    case 'SET_BIG_BLIND':
      return { ...state, bigBlind: Math.max(1, action.amount) };

    case 'ADD_PLAYER': {
      // Reconnect: a player with this session token already exists, just
      // mark them connected again (see CONTEXT.md: Session Token).
      const reconnecting = state.players.find((p) => p.id === action.player.id);
      if (reconnecting) {
        return {
          ...state,
          players: state.players.map((p) => (p.id === action.player.id ? { ...p, status: 'connected' } : p)),
        };
      }

      if (state.players.length >= 8) return state; // table full

      const baseName = action.player.name;
      const sameNamePlayers = state.players.filter((p) => baseName === stripSuffix(p.name));

      if (sameNamePlayers.length >= 2) {
        throw new Error('name taken, try another');
      }

      let players = state.players;
      let newName = baseName;
      if (sameNamePlayers.length === 1) {
        // Retroactively relabel the existing player as (A), new player becomes (B).
        const existing = sameNamePlayers[0];
        players = players.map((p) => (p.id === existing.id ? { ...p, name: `${baseName} (A)` } : p));
        newName = `${baseName} (B)`;
      }

      return { ...state, players: [...players, { ...action.player, name: newName }] };
    }

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter((p) => p.id !== action.playerId) };

    case 'SET_PLAYER_STATUS':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.playerId ? { ...p, status: action.status } : p)),
      };

    case 'START_GAME': {
      const players = state.players.map((p) => ({ ...p, chips: state.startingChips }));
      return dealNewHand({ ...state, phase: 'game', players });
    }

    case 'NEXT_HAND':
      return dealNewHand(state);

    case 'PROPOSE_ACTION': {
      if (action.action.playerId !== state.currentTurnPlayerId) return state;

      const player = state.players.find((p) => p.id === action.action.playerId);
      if (player?.isHost) {
        // The host's own actions apply immediately, no confirmation step.
        return applyAction(state, action.action);
      }

      const pending: PendingAction = { ...action.action, id: action.id };
      return { ...state, pendingAction: pending };
    }

    case 'EDIT_PENDING_ACTION':
      return state.pendingAction
        ? { ...state, pendingAction: { ...state.pendingAction, amount: action.amount } }
        : state;

    case 'CONFIRM_PENDING_ACTION': {
      if (!state.pendingAction) return state;
      const { id: _id, ...confirmedAction } = state.pendingAction;
      return applyAction(state, confirmedAction);
    }

    case 'REJECT_PENDING_ACTION':
      return { ...state, pendingAction: null };

    case 'REPLACE_STATE':
      return action.state;

    case 'LEAVE_LOBBY':
      return { ...initialGameState, phase: 'home' };

    case 'PROMOTE_TO_HOST':
      return {
        ...state,
        players: state.players
          .filter((p) => p.id !== action.removePlayerId)
          .map((p) => (p.id === action.newHostId ? { ...p, isHost: true } : p)),
      };

    default:
      return state;
  }
}
