import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { MultiplayerGame } from "@/confourComponents/game/create-game.tsx";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [activeGames, setActiveGames] = useState<MultiplayerGame[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetching games with the status "waiting"
    const fetchGames = async () => {
      const { data: games, error } = await supabase
        .from("games")
        .select("*")
        .eq("game_status", "waiting");

      if (error) {
        console.error("Error fetching games: ", error);
      } else {
        setActiveGames(games);
      }
    };

    fetchGames();

    // Subscribe to channel to get notified of any changes to "games" table
    const gameChannel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        async (payload) => {
          console.log("Change received!", payload);
          await fetchGames();
        },
      )
      .subscribe();

    return () => {
      gameChannel.unsubscribe();
    };
  }, []);

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div>
      <h2>Available Games</h2>
      <div>
        {/* "active" games in the sense you can join them since the initiator is still "waiting" */}
        {activeGames.map((game) => (
          <button
            key={game.game_id}
            onClick={() => handleGameClick(game.game_id)}
            style={{ display: "block", margin: "10px 0" }}
          >
            Join Game: {game.game_id}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
