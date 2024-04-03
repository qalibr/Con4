export type Token = undefined | null | Player; // undefined/null means open spot, Player means token is there or not.
export type TokenBoard = Token[][]; // Map of tokens to make up a board.
export type Player = "red" | "green" | null;
export type GameStatus = "inProgress" | "red" | "green" | "draw" | null;
export type QueueStatus = "1" | "2" | null;

export interface QueueEntry {
  match_id: string | null;
  red_id: string | null;
  red_status: boolean | null;
  green_id: string | null;
  green_status: boolean | null;
  queue_status: QueueStatus;
  red_ready: boolean;
  green_ready: boolean;
}

export interface MatchEntry {
  match_id: string | null;
  match_status: boolean;
  game_status: GameStatus;
  red_id: string | null;
  green_id: string | null;
  move_number: number;
  made_move: Player;
  board: TokenBoard;
  current_player: Player;
}
