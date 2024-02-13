import React, { useEffect, useRef, useState } from "react";
import {
  checkBoardState,
  GameStatus,
  generateEmptyBoard,
  Player,
  TokenBoard,
} from "./GameLogicComponent.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert } from "@/components/ui/alert.tsx";
import { Application } from "pixi.js";

function GameComponent() {
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [gameStatus, setGameStatus] = useState<GameStatus>("inProgress");

  const pixiApp = useRef<Application | null>(null);
  const pixiContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pixiContainer.current && !pixiApp.current) {
      pixiApp.current = new Application({
        width: 500,
        height: 500,
      });
      pixiContainer.current.appendChild(
        pixiApp.current.view as unknown as HTMLCanvasElement,
      );
    }

    // Cleanup function to run when the component unmounts
    return () => {
      if (pixiApp.current) {
        pixiApp.current.destroy();
        pixiApp.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const winner = checkBoardState(board);
    if (winner) {
      setGameStatus(winner); // Possible: red, green or draw.
    }
  }, [board]);

  const handleColumnClick = (columnIndex: number) => {
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
  };

  const resetGame = () => {
    setBoard(generateEmptyBoard());
    setCurrentPlayer("red");
    setGameStatus("inProgress");
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
      <div ref={pixiContainer} />

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
