import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "@/supabaseClient.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";
import GameInstance from "@/confourComponents/multiplayer/game-instance.tsx";

// GamePage to render whatever we need in the game room instance
const GamePage = () => {
  const { user } = useAuth();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .eq("game_id", gameId)
          .single();

        if (error) throw error;
        setGame(data);
      } catch (error) {
        console.error("Error fetching game:", error);
        navigate("/"); // If error go to Home
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId, navigate]);

  if (loading) return <div>Loading game...</div>;
  if (!game) return <div>Game not found.</div>;

  return (
    <div>
      {/*<h1>Game: {gameId}</h1>*/}
      {/*<p>Status: {game.instance_status}</p>*/}

      <GameInstance />
    </div>
  );
};

export default GamePage;
