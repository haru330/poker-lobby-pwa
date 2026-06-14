// Core domain types. See CONTEXT.md for terminology.

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type ActionType = 'raise' | 'call' | 'check' | 'fold';

export interface Action {
  playerId: string;
  type: ActionType;
  /** For 'raise': the new total street contribution ("raise to $X"), not the increment. */
  amount?: number;
}

/** An action proposed by a guest, awaiting host confirmation (possibly edited). */
export interface PendingAction extends Action {
  id: string;
}

export type ConnectionStatus = 'connected' | 'disconnected';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface Player {
  id: string; // session token
  name: string; // display name, may include (A)/(B) suffix
  chips: number;
  hand: Card[]; // 2 hole cards (Texas Hold'em)
  status: ConnectionStatus;
  hasFolded: boolean;
  isAllIn: boolean;
  isHost: boolean;
  /** Chips put in during the current street (reset each street). */
  streetContribution: number;
  /** Chips put in during the current hand (reset each hand, used for side pots). */
  totalContribution: number;
  /** Whether this player has acted during the current street's betting round. */
  hasActed: boolean;
}

export interface Pot {
  id: string;
  amount: number;
  eligiblePlayerIds: string[]; // for side pots
}

export type LobbyPhase = 'setup' | 'home' | 'lobby' | 'game';

export interface ActionLogEntry {
  id: string;
  message: string;
}

export interface PotWinner {
  playerId: string;
  amount: number;
  handDescription: string;
}

export interface ShowdownResult {
  potId: string;
  winners: PotWinner[];
  /** How the winner(s) beat the closest non-winning hand, e.g. "K kicker" (null if no contest or a true split). */
  tiebreakNote: string | null;
}

export interface GameState {
  roomCode: string;
  phase: LobbyPhase;
  players: Player[];
  deck: Card[]; // remaining undealt cards
  communityCards: Card[];
  street: Street;
  pots: Pot[];
  dealerButtonIndex: number; // index into players array
  currentTurnPlayerId: string | null;
  /** The amount each player must match to stay in this street (highest streetContribution). */
  currentBet: number;
  /** Minimum size of the next raise. */
  minRaise: number;
  pendingAction: PendingAction | null;
  startingChips: number;
  bigBlind: number;
  /** Real-money stake: `amount` (EUR) corresponds to `chips` chips, for later win/loss calculation. */
  realMoneyPerChips: { chips: number; amount: number };
  actionLog: ActionLogEntry[];
  results: ShowdownResult[] | null;
}
