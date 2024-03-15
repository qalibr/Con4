import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import supabase from "@/supabaseClient.tsx";
import { v4 as uuidv4 } from "uuid";
import useAuth from "@/confourHooks/useAuth.tsx";

import { PlayerStatus } from "@/confourComponents/multiplayer/game-instance.tsx";
import { Player } from "@/confourComponents/game/game-logic.tsx";

export interface MultiplayerGame {
  game_id: string;
  game_status: "waiting" | "active" | "ended";
  game_creator: string;
  player_count: number;
  red_ready: PlayerStatus;
  player_id_red: string;
  green_ready: PlayerStatus;
  player_id_green: string;
  move_number: number;
  made_move: string;
  board: string;
  current_player: Player;
}

// Create a game instance and navigate to it.
const CreateGame = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // eslint-disable-next-line
  const [createdGame, setCreatedGame] = useState<MultiplayerGame | null>(null);

  const handleCreateGame = async () => {
    if (!user) {
      alert("Please log in to create a game.");
      return;
    }

    // Unique game ID to navigate to
    const gameId = uuidv4();

    // Create game entry in table, with gameId, status and creator.
    const { error } = await supabase
      .from("games")
      .insert([
        {
          game_id: gameId,
          game_status: "waiting",
          game_creator: user.id,
          player_count: 0,
          red_ready: "tentative",
          player_id_red: "",
          green_ready: "tentative",
          player_id_green: "",
          move_number: 0,
          made_move: "",
          board: "",
          current_player: "red",
        },
      ])
      .select();

    if (error) {
      console.error("Error creating a new game:", error);
    } else {
      const newGame: MultiplayerGame = {
        game_id: gameId,
        game_status: "waiting",
        game_creator: user.id,
        player_count: 0,
        red_ready: "tentative",
        player_id_red: "",
        green_ready: "tentative",
        player_id_green: "",
        move_number: 0,
        made_move: "",
        board: "",
        current_player: "red",
      };
      setCreatedGame(newGame);
      console.log("Game created successfully, navigating to the game room...");

      navigate(`/game/${gameId}`);
    }
  };

  return <Button onClick={handleCreateGame}>Create Game</Button>;
};

export default CreateGame;
