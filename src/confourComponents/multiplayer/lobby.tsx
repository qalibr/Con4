import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { MultiplayerGame } from "@/confourComponents/multiplayer/create-game.tsx";
import { useNavigate } from "react-router-dom";
// import useAuth from "@/confourHooks/useAuth.tsx";
import { RealtimeChannel } from "@supabase/supabase-js";

// Display game instances with the status "waiting", and provide a method to join a game.
const Lobby = () => {
  const [activeGames, setActiveGames] = useState<MultiplayerGame[]>([]);
  const navigate = useNavigate();
  // const { user } = useAuth();
  // const [onlineUsers, setOnlineUsers] = useState(0);

  // Fetching games with the status "waiting"
  useEffect(() => {
    let gameChannels: RealtimeChannel[] = [];

    const fetchGames = async () => {
      const { data: games, error } = await supabase
        .from("games")
        .select("*")
        .eq("game_status", "waiting");

      if (error) {
        console.error("Error fetching games: ", error);
      } else {
        setActiveGames(games);
        subscribeToGamePresence(games);
      }
    };

    // Subscribe to game presence, so that we can see how many player's are in each game instance.
    const subscribeToGamePresence = (games: MultiplayerGame[]) => {
      gameChannels.forEach((channel) => channel.unsubscribe());
      gameChannels = [];

      // Expensive foreach loop?
      games.forEach((game) => {
        const channelName = `presence-${game.game_id}`;
        const channel = supabase.channel(channelName);

        channel
          .on("broadcast", { event: "sync" }, async (payload) => {
            console.log(`Presence update for game ${game.game_id}`, payload);
            await fetchGames(); // Can be optimized?
          })
          .subscribe();

        gameChannels.push(channel);
      });
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
          await fetchGames(); // Refetch games on any change
        },
      )
      .subscribe();

    return () => {
      gameChannel.unsubscribe();
      gameChannels.forEach((channel) => channel.unsubscribe());
    };
  }, []); // Empty dependency means that this effect runs once on component mount

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div>
      <h2>Available Games</h2>
      <div>
        {activeGames.map((game) => (
          <button
            key={game.game_id}
            onClick={() => handleGameClick(game.game_id)}
            style={{ display: "block", margin: "10px 0" }}
          >
            Join Game: {game.game_id} (Players:{" "}
            {game.player_count ?? "Loading..."})
          </button>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
