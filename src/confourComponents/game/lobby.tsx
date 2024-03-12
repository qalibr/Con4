import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { MultiplayerGame } from "@/confourComponents/game/create-game.tsx";

const Lobby = () => {
  const [games, setGames] = useState<MultiplayerGame[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("game_status", "waiting");

      if (error) {
        console.error("Error fetching games:", error);
      } else {
        // Treating data as multiplayergame
        console.log("Fetched games:", data);
        setGames((data as MultiplayerGame[]) || []);
      }
    };

    fetchGames();

    // Subscribe to new games being created
    const subscription = supabase
      .from("games")
      .on("INSERT", (payload: { new: MultiplayerGame }) => {
        console.log("New game created:", payload.new);
        setGames((currentGames) => [
          ...currentGames,
          payload.new as MultiplayerGame,
        ]);
      })
      .subscribe();

    return () => {
      console.log("Unsubscribing from game creations.");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <h2>Available Games</h2>
      <ul>
        {games.map((game) => (
          <li key={game.game_id}>
            <Button onClick={() => navigate(`/game/${game.game_id}`)}>
              Join Game {game.game_id}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
