import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";
import { v4 as uuidv4 } from "uuid";

import { IMultiplayerGame } from "@/confourComponents/multiplayer/IMultiplayerGame.tsx";
import { IQueuedPlayer } from "@/confourComponents/multiplayer/IQueuedPlayer.tsx";

const Queue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queuedPlayers, setQueuedPlayers] = useState<IQueuedPlayer[]>([]);
  const [queuedCount, setQueuedCount] = useState(0);
  const [acceptedOne, setAcceptedOne] = useState<boolean>(false);
  const [acceptedTwo, setAcceptedTwo] = useState<boolean>(false);
  const { gameId } = useParams();
  const [createdGame, setCreatedGame] = useState<IMultiplayerGame | null>(null);

  /* Fetch queued players and broadcast on channel */
  useEffect(() => {
    const fetchQueuedPlayers = async () => {
      const { data, error } = await supabase
        .from("queue")
        .select("*")
        .eq("queue_entry_status", "queued"); // "queued" denotes a player waiting for a match.

      if (error) {
        console.error("Error fetching queue:", error);
      } else {
        setQueuedPlayers(data); // Keep track of status
        setQueuedCount(data.length); // How many players are in the queue
      }
    };

    fetchQueuedPlayers();

    // Listening for realtime changes
    const queueStatusChannel = supabase
      .channel(`queue-status`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        async (payload) => {
          console.log("Change received!", payload);
          await fetchQueuedPlayers(); // Fetch players again when a change is detected.
        },
      )
      .subscribe();

    return () => {
      queueStatusChannel.unsubscribe();
    };
  }, []);

  /* Match up players */
  useEffect(() => {
    // Set off trigger when the minimum is met.
    if (queuedCount >= 2) {
      const fetchPlayers = async () => {
        const { data, error } = await supabase
          .from("queue")
          .select("queue_id, queued_player_id")
          .eq("queue_entry_status", "queued")
          .limit(2);

        if (error) {
          console.error("Error fetching players for matchmaking: ", error);
        } else if (data && data.length >= 2) {
          // Store the players' ID's
          const player_id_one = data[0].queued_player_id;
          const player_id_two = data[1].queued_player_id;
          const gameId = uuidv4();

          await facilitateMatch(player_id_one, player_id_two, gameId);
        }
      };

      fetchPlayers();
    }
  }, [queuedCount]);

  // Function to facilitate the match, wait for both players to accept.
  const facilitateMatch = async (p1: string, p2: string, gid: string) => {
    await handleAcceptPrompt(p1, p2);

    if (acceptedOne && acceptedTwo) {
      const { error } = await supabase
        .from("games")
        .insert([
          {
            game_id: gid,
            instance_status: "waiting",
            player_id_red: p1,
            player_id_green: p2,
            move_number: 0,
            made_move: "",
            board: "",
            current_player: "red",
            game_status: "inProgress",
          },
        ])
        .select();

      if (error) {
        console.error("Error creating a new game:", error);
      } else {
        const newGame: IMultiplayerGame = {
          game_id: gid,
          instance_status: "waiting",
          player_id_red: p1,
          player_id_green: p2,
          move_number: 0,
          made_move: "",
          board: "",
          current_player: "red",
          game_status: "inProgress",
          game_creator: "-", // TODO: Delete this
          player_count: 2, // TODO: Delete this
          red_ready: "ready", // TODO: Delete this
          green_ready: "ready", // TODO: Delete this
        };
        setCreatedGame(newGame);
        console.log("Both players have accepted, navigating to game...");
        navigate(`/game/${gameId}`);
      }
    }
  };

  const handleAcceptPrompt = async (p1: string, p2: string) => {
    if (user?.id === p1) {
      setAcceptedOne(true);
    }

    if (user?.id === p2) {
      setAcceptedTwo(true);
    }
  };

  return (
    <div>
      <h2>Players in Queue</h2>
      <ul>
        {queuedPlayers.map((player, index) => (
          <li key={index}>
            {player.queued_player_id} - Status: {player.queue_entry_status}
          </li>
        ))}
      </ul>
      {/* Button to join the queue */}
      {/* Other UI components */}
    </div>
  );
};

export default Queue;
