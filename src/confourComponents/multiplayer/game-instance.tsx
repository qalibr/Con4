import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";
import supabase from "@/supabaseClient.tsx";
import { Button } from "@/components/ui/button.tsx";

import {
  checkBoardState,
  GameStatus,
  generateEmptyBoard,
  Player,
  TokenBoard,
} from "../game/game-logic.tsx";

export type PlayerStatus = "ready" | "tentative";

import { MultiplayerGame } from "@/confourComponents/multiplayer/create-game.tsx";
import { Alert } from "@/components/ui/alert.tsx";

function GameInstance() {
  const { user } = useAuth();
  const { gameId } = useParams();
  // Status
  const [redId, setRedId] = useState<string>();
  const [redReady, setRedReady] = useState<PlayerStatus>("tentative");
  const [greenId, setGreenId] = useState<string>();
  const [greenReady, setGreenReady] = useState<PlayerStatus>("tentative");
  const [readyPlayers, setReadyPlayers] = useState(0);
  // Game
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [gameStatus, setGameStatus] = useState<GameStatus>("inProgress");
  const [moveNumber, setMoveNumber] = useState<number>(0);

  // Realtime database handling game instances
  // Currently allows players to set their ready status,
  // this way we can assign IDs to the colors.
  // Check for winner of the game
  useEffect(() => {
    const winner = checkBoardState(board);
    if (winner) {
      setGameStatus(winner);
    }

    const fetchPlayerStatus = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("red_ready, green_ready")
        .eq("game_id", gameId)
        .single();

      if (error) {
        console.error("Error fetching player status:", error);
      } else if (data) {
        setRedReady(data.red_ready);
        setGreenReady(data.green_ready);
        const playersReady = [data.red_ready, data.green_ready].filter(
          (status) => status === "ready",
        ).length;
        console.log("Setting readyPlayers: ", playersReady);
        setReadyPlayers(playersReady);
      }
    };

    fetchPlayerStatus();

    const boardStatusChannel = supabase
      .channel(`game-status:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        (payload) => {
          console.log("Game update received:", payload);
          const newStatus = payload.new as MultiplayerGame;
          if (newStatus && newStatus.board) {
            const newBoard = JSON.parse(newStatus.board) as TokenBoard;
            setBoard(newBoard);
            setCurrentPlayer(currentPlayer === "red" ? "green" : "red");
            setMoveNumber((prev: number) => prev + 1);
          }
          if (newStatus.current_player) {
            setCurrentPlayer(newStatus.current_player);
          }
        },
      )
      .subscribe();

    const playerStatusChannel = supabase
      .channel(`game-status:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        (payload) => {
          console.log("Player status update received:", payload);
          const newStatus = payload.new as MultiplayerGame;
          if (newStatus) {
            console.log("Player status update received: ", newStatus);
            setRedReady(newStatus.red_ready);
            setGreenReady(newStatus.green_ready);
            const playersReady = [
              newStatus.red_ready,
              newStatus.green_ready,
            ].filter((status) => status === "ready").length;
            setReadyPlayers(playersReady);
          }
        },
      )
      .subscribe();

    return () => {
      playerStatusChannel.unsubscribe();
      boardStatusChannel.unsubscribe();
    };
  }, [gameId, board, currentPlayer]);

  const handlePlayerStatus = async () => {
    if (!user?.id || !gameId) {
      // @ts-expect-error checking above here
      if (user.id === null) {
        console.log("User ID is null");
      } else {
        // @ts-expect-error yes, expected.
        console.log("User ID: ", user.id);
      }
      if (gameId === null) {
        console.log("Game ID is null");
      } else {
        console.log("Game ID: ", gameId);
      }
      return;
    }

    if (readyPlayers === 0) {
      const { data, error } = await supabase
        .from("games")
        .update([
          {
            player_count: readyPlayers,
            red_ready: "ready",
            player_id_red: user.id,
          },
        ])
        .eq("game_id", gameId);

      setRedId(user.id);
      setReadyPlayers((prev: number) => prev + 1);
      setRedReady("ready");
      return;
    } else {
      console.log("RED");
      console.log("User ID: ", user.id);
      console.log("Room has: ", readyPlayers, "/2 players");
    }

    if (readyPlayers === 1 && user.id !== redId) {
      const { data, error } = await supabase
        .from("games")
        .update([
          {
            player_count: readyPlayers,
            green_ready: "ready",
            player_id_green: user.id,
          },
        ])
        .eq("game_id", gameId);

      setGreenId(user.id);
      setReadyPlayers((prev: number) => prev + 1);
      setGreenReady("ready");
      return;
    } else {
      if (user.id === redId) {
        console.log("Red cannot claim green ID as well");
      }

      console.log("GREEN");
      console.log("User ID: ", user.id);
      console.log("Room has: ", readyPlayers, "/2 players");
    }
  };

  const handleColumnClick = async (columnIndex: number) => {
    if (!user?.id || !gameId) {
      // @ts-expect-error checking above here
      if (user.id === null) {
        console.log("User ID is null");
      } else {
        // @ts-expect-error yes, expected.
        console.log("User ID: ", user.id);
      }
      if (gameId === null) {
        console.log("Game ID is null");
      } else {
        console.log("Game ID: ", gameId);
      }
      return;
    }

    if (gameStatus !== "inProgress") {
      console.log("Game is not in progress.");
      return;
    }

    // Must make sure correct player makes move
    if (
      (currentPlayer === "red" && user.id !== redId) ||
      (currentPlayer === "green" && user.id !== greenId)
    ) {
      console.log("Player cannot move out of turn.");
      console.log("Who's to go next: ", currentPlayer);
      console.log("Attempt made by ID: ", user.id);
      return;
    } else if (
      (currentPlayer === "red" && user.id === redId) ||
      (currentPlayer === "green" && user.id === greenId)
    ) {
      console.log(currentPlayer, " has made their move.");
    }

    const newBoard = [...board];
    let moveMade = false;
    for (let i = 0; i <= newBoard[columnIndex].length - 1; i++) {
      if (newBoard[columnIndex][i] === undefined) {
        newBoard[columnIndex][i] = currentPlayer; // Place token on board
        moveMade = true;
        break;
      }
    }

    if (!moveMade) {
      console.log("Column is full.");
      return;
    }

    // Update board state and switch players
    setBoard(newBoard);

    // Update board, swap player turns and increment move number
    await updateGameBoard(newBoard);
  };

  const updateGameBoard = async (newBoard: TokenBoard) => {
    const serializedBoard = JSON.stringify(newBoard);

    const { error } = await supabase
      .from("games")
      .update({
        board: serializedBoard,
        move_number: moveNumber + 1,
        current_player: currentPlayer === "red" ? "green" : "red",
      })
      .eq("game_id", gameId);

    if (error) {
      console.error("Error updating game board:", error);
    } else {
      // If the board update was successful, update the local state
      console.log("Update successful");
      console.log("Current player: ", currentPlayer);
      console.log("Move number: ", moveNumber);
      setCurrentPlayer(currentPlayer === "red" ? "green" : "red");
      setMoveNumber((prev) => prev + 1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "85vh",
      }}
    >
      <ul>
        <li>
          {readyPlayers < 2 && (
            <Button onClick={handlePlayerStatus}>Ready</Button>
          )}
        </li>
        <li>
          <h2>Red player: {redReady}</h2>
          <h2>Red ID: {redId}</h2>
        </li>
        <li>
          <h2>Green player: {greenReady}</h2>
          <h2>Green ID: {greenId}</h2>
        </li>
      </ul>

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
        </ul>
      </div>
    </div>
  );
}

export default GameInstance;
