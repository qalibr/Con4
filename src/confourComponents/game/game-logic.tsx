import { Player, TokenBoard } from "@/confourComponents/game/types.tsx";

// Generate empty board for play.
export function generateEmptyBoard(): TokenBoard {
  // Map of tokens that can be accessed by coordinates, [x][y]
  return Array(7)
    .fill(undefined)
    .map(() => Array(6).fill(undefined));
}

// Check for winner or inconclusive board state
// Token represents current player's color
export function checkBoardState(
  board: TokenBoard,
): Player | "draw" | "inProgress" | null | undefined {
  // Check for horizontal win
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 6; y++) {
      const token = board[x][y];
      // console.log(token);
      if (token === undefined || token === null) continue;
      if (
        token === board[x + 1][y] &&
        token === board[x + 2][y] &&
        token === board[x + 3][y]
      ) {
        return token;
      }
    }
  }

  // Check for vertical win
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 3; y++) {
      const token = board[x][y];
      // console.log(token);
      if (token === undefined || token === null) continue;
      if (
        token === board[x][y + 1] &&
        token === board[x][y + 2] &&
        token === board[x][y + 3]
      ) {
        return token;
      }
    }
  }

  // Check for diagonal win in '/' direction
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 3; y++) {
      const token = board[x][y];
      // console.log(token);
      if (token === undefined || token === null) continue;
      if (
        token === board[x + 1][y + 1] &&
        token === board[x + 2][y + 2] &&
        token === board[x + 3][y + 3]
      ) {
        return token;
      }
    }
  }

  // Check for diagonal win in '\' direction
  for (let x = 0; x < 4; x++) {
    for (let y = 3; y < 6; y++) {
      const token = board[x][y];
      // console.log(token);
      if (token === undefined || token === null) continue;
      if (
        token === board[x + 1][y - 1] &&
        token === board[x + 2][y - 2] &&
        token === board[x + 3][y - 3]
      ) {
        return token;
      }
    }
  }

  // console.log("Board: ", board);
  // Check for draw
  // BUG: With multiplayer the array is populated with nulls. If I fix this that will break the single-player checks.
  // Resolved: Fixed multiplayer draw check by simply counting moves. Implement that here later.
  if (board.every((column) => column.every((cell) => cell !== undefined))) {
    return "draw";
  }

  // Check if game is in progress
  if (!board.every((column) => column.every((cell) => cell !== undefined))) {
    return "inProgress";
  }

  return undefined;
}
