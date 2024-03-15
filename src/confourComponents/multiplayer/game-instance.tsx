import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";
import supabase from "@/supabaseClient.tsx";
import { Button } from "@/components/ui/button.tsx";

export type PlayerStatus = "ready" | "tentative";

import { MultiplayerGame } from "@/confourComponents/multiplayer/create-game.tsx";

function GameInstance() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [redId, setRedId] = useState<string>();
  const [redReady, setRedReady] = useState<PlayerStatus>("tentative");
  const [greenId, setGreenId] = useState<string>();
  const [greenReady, setGreenReady] = useState<PlayerStatus>("tentative");
  const [readyPlayers, setReadyPlayers] = useState(0);

  // Realtime database handling game instances
  // Currently allows players to set their ready status,
  // this way we can assign IDs to the colors.
  // TODO: Need to update player_count when players leave
  useEffect(() => {
    const fetchStatus = async () => {
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

    fetchStatus();

    const statusChannel = supabase
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
      statusChannel.unsubscribe();
    };
  }, [gameId]);

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

  return (
    <>
      {readyPlayers < 2 && <Button onClick={handlePlayerStatus}>Ready</Button>}
      <p>
        Red Ready: {redReady}, Red ID: {redId}
      </p>
      <p>
        Green Ready: {greenReady}, Green ID: {greenId}
      </p>
    </>
  );
}

export default GameInstance;
