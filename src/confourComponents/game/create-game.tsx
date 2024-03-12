import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import supabase from "@/supabaseClient.tsx";
import { v4 as uuidv4 } from "uuid";
import useAuth from "@/confourHooks/useAuth.tsx";

export interface MultiplayerGame {
  game_id: string;
  game_status: "waiting" | "active" | "ended";
  game_creator: string;
}

const CreateGame = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (!user) {
      alert("Please log in to create a game.");
      return;
    }

    const gameId = uuidv4();

    // Create game entry in table
    const { error } = await supabase.from("games").insert([
      {
        game_id: gameId,
        game_status: "waiting",
        game_creator: user.id,
      },
    ]);

    if (error) {
      console.error("Error creating a new game:", error);
    } else {
      // Create unique URL from which to host the game
      console.log("Game created successfully, navigating to the game room...");
      navigate(`/game/${gameId}`);
    }
  };

  return <Button onClick={handleCreateGame}>Create Game</Button>;
};

export default CreateGame;
