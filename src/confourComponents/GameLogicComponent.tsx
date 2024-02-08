export type Player = 'red' | 'green';
type Token = undefined | Player; // Undefined means open spot, Player means token is there or not.
export type TokenBoard = Token[][]; // Map of tokens
export type GameStatus = 'inProgress' | 'red' | 'green' | 'draw';

/* Generate empty board for play. */
export function generateEmptyBoard(): TokenBoard {
        // This can be accessed by coordinates, [x][y]
        return Array(7).fill(undefined).map(() => Array(6).fill(undefined));
}

/* Check for winner or inconclusive board state */
export function checkBoardState(board: TokenBoard): Player | 'draw' | undefined {
        // Check for horizontal win
        for (let x = 0; x < 4; x++) {
                for (let y = 0; y < 6; y++) {
                        const token = board[x][y];
                        if (token === undefined) continue;
                        if (token === board[x + 1][y] && token === board[x + 2][y] && token === board[x + 3][y]) {
                                return token;
                        }
                }
        }

        // Check for vertical win
        for (let x = 0; x < 7; x++) {
                for (let y = 0; y < 3; y++) {
                        const token = board[x][y];
                        if (token === undefined) continue;
                        if (token === board[x][y + 1] && token === board[x][y + 2] && token === board[x][y + 3]) {
                                return token;
                        }
                }
        }

        // Check for diagonal win
        for (let x = 0; x < 4; x++) {
                for (let y = 0; y < 3; y++) {
                        const token = board[x][y];
                        if (token === undefined) continue;
                        if (token === board[x + 1][y + 1] && token === board[x + 2][y + 2] && token === board[x + 3][y + 3]) {
                                return token;
                        }
                }
        }

        // Check for other diagonal win
        for (let x = 0; x < 4; x++) {
                for (let y = 3; y < 6; y++) {
                        const token = board[x][y];
                        if (token === undefined) continue;
                        if (token === board[x + 1][y - 1] && token === board[x + 2][y - 2] && token === board[x + 3][y - 3]) {
                                return token;
                        }
                }
        }

        // Check for draw
        if (board.every(column => column.every(cell => cell !== undefined))) {
                return 'draw';
        }

        return undefined;
}