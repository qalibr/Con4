export type GameStatus = "inProgress" | "red" | "green" | "draw";
export type InstanceStatus = "waiting" | "active" | "ended";
export type Token = undefined | null | Player; // undefined/null means open spot, Player means token is there or not.
export type TokenBoard = Token[][]; // Map of tokens to make up a board.
export type PlayerStatus = "ready" | "tentative";
export type Player = "red" | "green";
