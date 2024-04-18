export type Token = Player | null; // null means open spot, Player means token is there or not.
export type TokenBoard = Token[][]; // Map of tokens to make up a board.
export type Player = "red" | "green" | null;
export type GameStatus = "inProgress" | "draw" | null;
export type QueueCount = "1" | "2" | null;