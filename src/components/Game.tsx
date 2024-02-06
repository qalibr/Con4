import React, { useEffect, useState } from "react";

type Player = 'red' | 'green';
type Token = undefined | Player; // Undefined means open spot, Player means token is there or not.
type TokenBoard = Token[][]; // Map of tokens
type GameStatus = 'inProgress' | 'red' | 'green' | 'draw';

/* Generate empty board for play. */
function generateEmptyBoard(): TokenBoard {
        // This can be accessed by coordinates, [x][y]
        return Array(7).fill(undefined).map(() => Array(6).fill(undefined));
}

/* Check for winner or inconclusive board state */
function checkBoardState(board: TokenBoard): Player | 'draw' | undefined {
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

function Game() {
        const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
        const [currentPlayer, setCurrentPlayer] = useState<Player>('red');
        const [gameStatus, setGameStatus] = useState<GameStatus>('inProgress');

        useEffect(() => {
                const winner = checkBoardState(board);
                if (winner) {
                        setGameStatus(winner); // Possible: red, green or draw.
                }
        }, [board]);


        const handleColumnClick = (columnIndex: number) => {
                if (gameStatus !== 'inProgress') return; // Prevent moves if the game is over

                const newBoard = [...board];
                for (let i = 0; i <= newBoard[columnIndex].length - 1; i++) {
                        if (newBoard[columnIndex][i] === undefined) {
                                newBoard[columnIndex][i] = currentPlayer; // Place the token
                                break; // Exit the loop once the token is placed
                        }
                }

                // Update the board state and switch the current player
                setBoard(newBoard);
                setCurrentPlayer(currentPlayer === 'red' ? 'green' : 'red');
        };

        const resetGame = () => {
                setBoard(generateEmptyBoard());
                setCurrentPlayer('red');
                setGameStatus('inProgress');
        };

        return (
            <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "85vh"
            }}>
                    <div style={{display: "flex"}}>
                            {board.map((column, columnIndex) => (
                                <div key={columnIndex}
                                     style={{display: "flex", flexDirection: "column-reverse", margin: "5px"}}>
                                        {column.map((cell, rowIndex) => (
                                            <div key={rowIndex} onClick={() => handleColumnClick(columnIndex)} style={{
                                                    width: "50px",
                                                    height: "50px",
                                                    border: "1px solid black",
                                                    backgroundColor: cell || "white"
                                            }}></div>
                                        ))}
                                </div>
                            ))}
                    </div>
                    <div style={{marginTop: "20px"}}>
                            {gameStatus !== 'inProgress' &&
                                <p style={{color: "white"}}>Game
                                    Over: {gameStatus === 'draw' ? 'Draw' : `Winner is ${gameStatus}`}</p>}
                            <button onClick={resetGame}
                                    style={{padding: "10px 20px", fontSize: "16px", color: "white"}}>Reset Game
                            </button>
                    </div>
            </div>
        );
}

export default Game;