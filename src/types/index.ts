export interface Broadcast {
  tour: {
    id: string;
    name: string;
    description: string;
    url: string;
    markdown: string;
    tier: "official" | "high" | "medium" | "low";
  };
  rounds: BroadcastRound[];
}

export interface BroadcastRound {
  id: string;
  name: string;
  slug?: string;
  url?: string;
  startsAt?: number;
  finished?: boolean;
}

export interface LeaderboardPlayer {
  name: string;
  title?: string;
  rating: number;
  fideId?: number;
  team?: string;
  fed?: string;
  played: number;
  score: number;
  ratingDiff?: number;
  performance?: number;
}

export interface BroadcastPlayer {
  name: string;
  title?: "GM" | "IM" | "FM" | "WGM" | "WIM" | "WFM" | "NM" | "CM" | "WCM";
  rating: number;
  clock?: number;
  team?: string;
  fideId?: number;
  fed?: string;
}

export interface Game {
  id?: string;
  name?: string;
  fen?: string;
  players: BroadcastPlayer[];
  status?: GameStatus;
  winner?: 'white' | 'black';
  moves?: string;
  lastMove?: string;
  thinkTime?: number;
  whiteClock?: number;
  blackClock?: number;
  pgn?: string;
  fenHistory?: string[];
  moveHistory?: (string | undefined)[];
  currentMoveIndex?: number;
}

export type GameStatus =
  | "started"
  | "playing"
  | "aborted"
  | "mate"
  | "draw"
  | "resign"
  | "stalemate"
  | "timeout"
  | "outoftime";

export type ViewState = "broadcast-list" | "rounds-list" | "games-list" | "game-view";

export interface ErrorState {
  message: string;
  retryCount: number;
  canRetry: boolean;
  lastError: Error | null;
}
