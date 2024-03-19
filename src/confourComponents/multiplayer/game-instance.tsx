import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert } from "@/components/ui/alert.tsx";
import { useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";

import {
  checkBoardState,
  generateEmptyBoard,
  Player,
  TokenBoard,
} from "../game/game-logic.tsx";
import { MultiplayerGame } from "@/confourComponents/multiplayer/create-game.tsx";
import { PlayerStatus } from "@/confourComponents/multiplayer/PlayerStatus.tsx";
import { InstanceStatus } from "@/confourComponents/multiplayer/InstanceStatus.tsx";
import { GameStatus } from "@/confourComponents/multiplayer/GameStatus.tsx";

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
  const [instanceStatus, setInstanceStatus] =
    useState<InstanceStatus>("waiting");
  const [moveNumber, setMoveNumber] = useState<number>(0);

  // temp
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameState, setGameState] = useState<boolean>(false);

  useEffect(() => {
    console.log("-----\nMARCO");
    // Checking for a winner
    const winner = checkBoardState(board);
    console.log("GAMESTATUS: ", gameStatus);
    console.log("GAMEOVER: ", gameOver);
    console.log("GAMESTATE: ", gameState);
    console.log("BOARD STATE: ", winner);
    if (winner === "red" || winner === "green") {
      // console.log("!! Winner is: ", winner);
      setGameStatus(winner);
      setInstanceStatus("ended");
    } else if (moveNumber === 42) {
      setGameStatus("draw"); // Checking for draw using move count instead.
      setInstanceStatus("ended");
    } else {
      setGameStatus("inProgress");
      // setInstanceStatus("active");
    }

    const fetchGameState = async () => {
      const { data, error } = await supabase
        .from("games")
        .select(
          "red_ready, green_ready, player_id_red, player_id_green, board, current_player, move_number, instance_status, player_count, game_status", // Fetching from "games"
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
        setMoveNumber(data.move_number);
        setCurrentPlayer(data.current_player);
        setInstanceStatus(data.instance_status);
        setGameStatus(data.game_status);
        // console.log("Instance Status: ", data.instance_status);
        setReadyPlayers(data.player_count);
        // console.log("Ready Players: ", data.player_count);

        // Fetch board state
        if (data.board) {
          try {
            const updatedBoard = JSON.parse(data.board) as TokenBoard;
            setBoard(updatedBoard);
          } catch (parseErr) {
            console.error("Error parsing board data: ", parseErr);
          }
        }
      }
    };

    fetchGameState();
    updateGameInstance();

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
            setReadyPlayers(newStatus.player_count);
            setInstanceStatus(newStatus.instance_status);
            setGameStatus(newStatus.game_status);
            // console.log(
            //   "Instance Status (Channel): ",
            //   newStatus.instance_status,
            // );
            // console.log("Game Status (Channel): ", gameStatus);
          } else {
            console.log("Error listening to updates on playerStatusChannel");
          }

          // Setting board state
          if (newStatus.board) {
            try {
              const updatedBoard = JSON.parse(newStatus.board) as TokenBoard;
              setBoard(updatedBoard);

              setCurrentPlayer(currentPlayer === "red" ? "green" : "red");
              setMoveNumber((prev: number) => prev);
            } catch (error) {
              console.error("Error parsing board data:", error);
            }
          }

          // Changing current player
          if (newStatus.current_player) {
            setCurrentPlayer(newStatus.current_player);
          } else {
            console.log("Error listening for changes to current player.");
          }
        },
      )
      .subscribe();

    console.log("POLO");
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
      // setInstanceStatus("waiting");
      const { error } = await supabase
        .from("games")
        .update([
          {
            player_count: readyPlayers + 1,
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
      // console.log("Red uid: ", user?.id, "\n Room: ", readyPlayers, "/2");
    }

    // Second player to hit ready button becomes the green player.
    if (readyPlayers === 1 && user?.id !== redId) {
      // setInstanceStatus("active");
      const { error } = await supabase
        .from("games")
        .update([
          {
            player_count: readyPlayers + 1,
            green_ready: "ready",
            player_id_green: user?.id,
            // instance_status: instanceStatus,
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
        // console.log("Red cannot claim green ID as well");
      }
      // console.log("Green uid: ", user?.id, "\n Room: ", readyPlayers, "/2");
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
      // console.log("Not your turn.");
      return;
    } else if (
      (currentPlayer === "red" && user?.id === redId) ||
      (currentPlayer === "green" && user?.id === greenId)
    ) {
      // console.log(currentPlayer, " has made his move.");
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
        // console.log(`Placing token at: ${i}`);
        newBoard[columnIndex][i] = currentPlayer;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // console.log("Column is full.");
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
        game_status: gameStatus,
      })
      .eq("game_id", gameId);

    if (error) {
      console.error("Error updating game board:", error);
    }
  };

  const updateGameInstance = async () => {
    if (
      gameStatus !== "inProgress" ||
      gameStatus === "red" ||
      gameStatus === "green"
    ) {
      setGameOver(true);
    }
    console.log("GAME OVER: ", gameOver);

    if (readyPlayers === 2) {
      setGameState(true);
    }
    console.log("READY: ", gameState, ".. COUNT: ", readyPlayers);

    const { error } = await supabase
      .from("games")
      .update({
        instance_status: gameOver ? "ended" : gameState ? "active" : "waiting",
      })
      .eq("game_id", gameId);

    setInstanceStatus(gameOver ? "ended" : gameState ? "active" : "waiting");

    if (error) {
      console.error("Error updating Game Instance status: ", error);
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
          <h1>
            Game: {gameId}
            <p>Status: {instanceStatus}</p>
          </h1>
        </li>
        <li>
          <h2>Red player: {redReady}</h2>
          <h2>Red ID: {redId}</h2>
        </li>
        <li>
          <h2>Green player: {greenReady}</h2>
          <h2>Green ID: {greenId}</h2>
        </li>
        <li>Move Number: {moveNumber}</li>
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
