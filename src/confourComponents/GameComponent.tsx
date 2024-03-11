import React, { useEffect, useState } from "react";
import {
  checkBoardState,
  GameStatus,
  generateEmptyBoard,
  Player,
  TokenBoard,
} from "./game/game-logic.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert } from "@/components/ui/alert.tsx";

// Facilitate multiplayer
import { v4 as uuidv4 } from "uuid";
import supabase from "@/supabaseClient.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";

function GameComponent() {
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [gameStatus, setGameStatus] = useState<GameStatus>("inProgress");
  const [gameId, setGameId] = useState(uuidv4()); // Initialize game_id with a unique value which we manage
  const [moveNumber, setMoveNumber] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const winner = checkBoardState(board);
    if (winner) {
      setGameStatus(winner); // Possible: red, green or draw.
    }
  }, [board]);

  const handleColumnClick = async (columnIndex: number) => {
    if (gameStatus !== "inProgress") return; // Prevent moves if the game is over

    const newBoard = [...board];
    for (let i = 0; i <= newBoard[columnIndex].length - 1; i++) {
      if (newBoard[columnIndex][i] === undefined) {
        newBoard[columnIndex][i] = currentPlayer; // Place the token
        break; // Exit the loop once the token is placed
      }
    }

    // Update the board state and switch the current player
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === "red" ? "green" : "red");

    // Track moves and which player made them
    setMoveNumber((prev) => prev + 1);
    const { error } = await supabase.from("moves").insert([
      {
        game_id: gameId,
        // @ts-expect-error user could be null
        player: user.id,
        player_color: currentPlayer,
        column_index: columnIndex,
        move_number: moveNumber,
      },
    ]);

    if (error) {
      console.error("Error inserting move to Supabase:", error.message);
    }
  };

  const resetGame = () => {
    setBoard(generateEmptyBoard());
    setCurrentPlayer("red");
    setGameStatus("inProgress");
    setGameId(uuidv4()); // Start a new game session
    setMoveNumber(0); // Reset move counter
  };

  return (
    // The board itself
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "85vh",
      }}
    >
      {/* Clickable columns */}
      <div style={{ display: "flex" }}>
        {board.map((column, columnIndex) => (
          <div
            key={columnIndex}
            style={{
              display: "flex",
              flexDirection: "column-reverse",
              margin: "5px",
            }}
          >
            {column.map((cell, rowIndex) => (
              <div
                key={rowIndex}
                onClick={() => handleColumnClick(columnIndex)}
                style={{
                  width: "50px",
                  height: "50px",
                  border: "1px solid black",
                  backgroundColor: cell || "white",
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>

      {/* Notify user of win/loss. Allow them to reset game at any time. */}
      <div style={{ marginTop: "20px" }}>
        <ul className="flex-auto items-center">
          <li style={{ marginTop: "0px" }}>
            {gameStatus !== "inProgress" && (
              <Alert>
                Game Over:{" "}
                {gameStatus === "draw" ? "Draw" : `Winner is ${gameStatus}`}
              </Alert>
            )}
          </li>
          <li style={{ marginTop: "8px" }}>
            <Button onClick={resetGame}>Reset Game</Button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default GameComponent;
