import {
  GameStatus,
  Player,
  TokenBoard,
} from "@/confourComponents/game/types.tsx";

// Generate empty board for play.
export function generateEmptyBoard(): TokenBoard {
  // Map of tokens that can be accessed by coordinates, [x][y]
  return Array(7)
    .fill(null)
    .map(() => Array(6).fill(null));
}

// Check for winner or inconclusive board state
// Token represents current player's color
export function checkBoardState(board: TokenBoard): GameStatus | Player {
  if (!board) {
    // console.log("|| Board is: ", board, "... Returning null...");
    return null;
  }
  // Check for horizontal win
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 6; y++) {
      const token = board[x][y];
      // // console.log(token);
      if (token === null) continue;
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
      // // console.log(token);
      if (token === null) continue;
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
      // // console.log(token);
      if (token === null) continue;
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
      // // console.log(token);
      if (token === null) continue;
      if (
        token === board[x + 1][y - 1] &&
        token === board[x + 2][y - 2] &&
        token === board[x + 3][y - 3]
      ) {
        return token;
      }
    }
  }

  if (board.every((column) => column.every((cell) => cell !== null))) {
    // console.log("|| Returned draw...");
    return "draw";
  }

  // Check if game is in progress
  if (!board.every((column) => column.every((cell) => cell !== null))) {
    // console.log("|| Returned inProgress...");
    return "inProgress";
  }

  // console.log("|| All checks failed, returning null");
  return null;
}
