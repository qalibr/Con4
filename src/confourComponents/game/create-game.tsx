import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import supabase from "@/supabaseClient.tsx";
import { v4 as uuidv4 } from "uuid";

const CreateGame = () => {
  const handleCreateGame = async () => {
    const gameId = uuidv4();

    const { error } = await supabase.from("games").insert([{ id: gameId }]);

    if (error) {
      console.error("Error creating a new game:", error);
    } else {
      // navigate(`/game/${gameId}`);
    }
  };

  return <Button onClick={handleCreateGame}>Create Game</Button>;
};

export default CreateGame;
