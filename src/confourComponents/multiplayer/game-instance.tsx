import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert } from "@/components/ui/alert.tsx";
import { useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";

import {
  checkBoardState,
  GameStatus,
  generateEmptyBoard,
  Player,
  TokenBoard,
} from "../game/game-logic.tsx";
import { MultiplayerGame } from "@/confourComponents/multiplayer/create-game.tsx";

export type PlayerStatus = "ready" | "tentative";

function GameInstance() {
  // Player status
  const { user } = useAuth();
  const [redId, setRedId] = useState<string>();
  const [redReady, setRedReady] = useState<PlayerStatus>("tentative");
  const [greenId, setGreenId] = useState<string>();
  const [greenReady, setGreenReady] = useState<PlayerStatus>("tentative");
  const [readyPlayers, setReadyPlayers] = useState(0);
  // Game state
  const { gameId } = useParams();
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [gameStatus, setGameStatus] = useState<GameStatus>("inProgress");
  const [moveNumber, setMoveNumber] = useState<number>(0);

  useEffect(() => {
    // Checking for a winner
    // BUG: Doesn't end game when 4 in a row occurs
    const winner = checkBoardState(board);
    if (winner) {
      setGameStatus(winner);
    }

    const fetchGameState = async () => {
      const { data, error } = await supabase
        .from("games")
        .select(
          "red_ready, green_ready, player_id_red, player_id_green, board, current_player", // Fetching from "games"
        )
        .eq("game_id", gameId) // For game ID
        .single(); // one row

      if (error) {
        console.error("Error fetching player status:", error);
      } else if (data) {
        // Fetching ready status and ID's
        setRedReady(data.red_ready);
        setRedId(data.player_id_red);
        setGreenReady(data.green_ready);
        setGreenId(data.player_id_green);
        const playersReady = [data.red_ready, data.green_ready].filter(
          (status) => status === "ready",
        ).length;
        setReadyPlayers(playersReady);

        // Fetch board state
        if (data.board) {
          try {
            const updatedBoard = JSON.parse(data.board) as TokenBoard;
            setBoard(updatedBoard);
          } catch (parseErr) {
            console.error("Error parsing board data: ", parseErr);
          }
        }
        // Fetch player turn
        setCurrentPlayer(data.current_player);

        // Summary of fetched items
        console.log(
          "Setting readyPlayers: ",
          playersReady,
          // "\n Board state: ",
          // data.board,
          "\n Player to go: ",
          data.current_player,
        );
      }
    };

    fetchGameState();

    // Listening for realtime changes and updating state variables
    const playerStatusChannel = supabase
      .channel(`game-status:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        (payload) => {
          const newStatus = payload.new as MultiplayerGame;
          if (newStatus) {
            // console.log("Player status update received: ", newStatus);
            // Setting player status
            setRedReady(newStatus.red_ready);
            setRedId(newStatus.player_id_red);
            setGreenReady(newStatus.green_ready);
            setGreenId(newStatus.player_id_green);
            const playersReady = [
              newStatus.red_ready,
              newStatus.player_id_red,
              newStatus.green_ready,
              newStatus.player_id_green,
            ].filter((status) => status === "ready").length;
            setReadyPlayers(playersReady);
          }

          // Setting board state
          if (newStatus.board) {
            try {
              const updatedBoard = JSON.parse(newStatus.board) as TokenBoard;
              setBoard(updatedBoard);

              setCurrentPlayer(currentPlayer === "red" ? "green" : "red");
              setMoveNumber((prev: number) => prev + 1);
            } catch (error) {
              console.error("Error parsing board data:", error);
            }
          }

          // Changing current player
          if (newStatus.current_player) {
            setCurrentPlayer(newStatus.current_player);
          }
        },
      )
      .subscribe();

    return () => {
      playerStatusChannel.unsubscribe();
    };
  }, [gameId, currentPlayer]); // BUG: Don't add Board as dependency, will cause infinite loop.

  const handlePlayerStatus = async () => {
    if (user?.id === null) {
      console.log("User ID is null");
      return;
    }
    if (gameId === null) {
      console.log("Game ID is null");
      return;
    }

    // First player to hit Ready button will become red player and have move 0.
    if (readyPlayers === 0) {
      const { error } = await supabase
        .from("games")
        .update([
          {
            player_count: readyPlayers,
            red_ready: "ready",
            player_id_red: user?.id,
          },
        ])
        .eq("game_id", gameId);

      if (error) {
        console.log("Failed to update table: ", error.message);
        return;
      }

      setRedId(user?.id);
      setReadyPlayers((prev: number) => prev + 1);
      setRedReady("ready");
      return;
    } else {
      console.log("Red uid: ", user?.id, "\n Room: ", readyPlayers, "/2");
    }

    // Second player to hit ready button becomes the green player.
    if (readyPlayers === 1 && user?.id !== redId) {
      const { error } = await supabase
        .from("games")
        .update([
          {
            player_count: readyPlayers,
            green_ready: "ready",
            player_id_green: user?.id,
          },
        ])
        .eq("game_id", gameId);

      if (error) {
        console.log("Failed to update table: ", error.message);
        return;
      }

      setGreenId(user?.id);
      setReadyPlayers((prev: number) => prev + 1);
      setGreenReady("ready");
      return;
    } else {
      if (user?.id === redId) {
        console.log("Red cannot claim green ID as well");
      }
      console.log("Green uid: ", user?.id, "\n Room: ", readyPlayers, "/2");
    }
  };

  // BUG: Win condition is not correctly determined.
  const handleColumnClick = async (columnIndex: number) => {
    if (user?.id === null) {
      console.log("User ID is null");
      return;
    }
    if (gameId === null) {
      console.log("Game ID is null");
      return;
    }
    if (gameStatus !== "inProgress") {
      console.log("Game is not in progress.");
      return;
    }

    // Must make sure correct player makes move
    if (
      (currentPlayer === "red" && user?.id !== redId) ||
      (currentPlayer === "green" && user?.id !== greenId)
    ) {
      console.log("Not your turn.");
      return;
    } else if (
      (currentPlayer === "red" && user?.id === redId) ||
      (currentPlayer === "green" && user?.id === greenId)
    ) {
      console.log(currentPlayer, " has made his move.");
    }

    const newBoard = board.map((column) => [...column]);
    let placed = false;
    for (let i = 0; i <= newBoard[columnIndex].length - 1; i++) {
      // Unpopulated cells in the array are undefined initially, that was how the game was designed,
      // but are null after the first move. This was an annoying bug.
      if (
        newBoard[columnIndex][i] === undefined ||
        newBoard[columnIndex][i] === null
      ) {
        console.log(`Placing token at: ${i}`);
        newBoard[columnIndex][i] = currentPlayer;
        placed = true;
        break;
      }
    }

    if (!placed) {
      console.log("Column is full.");
      return;
    }

    // console.log(`Old Board State:`, board);
    // console.log(`New Board State:`, newBoard);
    setBoard(newBoard);
    await updateGameBoard(newBoard);
  };

  const updateGameBoard = async (newBoard: TokenBoard) => {
    // Make board into a JSON string before updating entry in table.
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
      console.log("Board update successful");
      setCurrentPlayer(currentPlayer === "red" ? "green" : "red");
      setMoveNumber((prev) => prev + 1);
      setBoard(newBoard);
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
