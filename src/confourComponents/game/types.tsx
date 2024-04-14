export type Token = Player | null; // null means open spot, Player means token is there or not.
export type TokenBoard = Token[][]; // Map of tokens to make up a board.
export type Player = "red" | "green" | null;
export type GameStatus = "inProgress" | "draw" | null;
export type QueueCount = "1" | "2" | null;

export interface QueueEntry {
  match_id: string | null;
  match_found: boolean;
  red_id: string | null;
  red_status: boolean | null;
  green_id: string | null;
  green_status: boolean | null;
  queue_count: QueueCount;
  red_ready: boolean;
  green_ready: boolean;
}

export interface MatchEntry {
  id: number | undefined;
  created_at: string;
  match_id: string | null;
  match_status: boolean; // Variable to mark a match as going from matchmaking to active
  game_status: GameStatus | Player;
  red_id: string | null;
  green_id: string | null;
  move_number: number;
  made_move: Player;
  current_player: Player;
  board: string; // Stored in database as JSON, so here it will be string.
  match_concluded: boolean; // Variable to mark matches as finished
}

export interface LastModifiedCell {
  columnNumber: number | null;
  rowNumber: number | null;
}
