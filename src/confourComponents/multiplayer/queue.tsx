import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";
import { v4 as uuidv4 } from "uuid";

import { IMultiplayerGame } from "@/confourComponents/multiplayer/IMultiplayerGame.tsx";
import { IQueuedPlayer } from "@/confourComponents/multiplayer/IQueuedPlayer.tsx";
import {
  InstanceStatus,
  PlayerStatus,
} from "@/confourComponents/multiplayer/multiplayer-types.tsx";
import { Button } from "@/components/ui/button.tsx";

const Queue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queuedPlayers, setQueuedPlayers] = useState<IQueuedPlayer[]>([]);
  const [queuedCount, setQueuedCount] = useState(0);

  // Subject to change
  const [playerOne, setPlayerOne] = useState<string>("");
  const [playerTwo, setPlayerTwo] = useState<string>("");
  const [acceptedOne, setAcceptedOne] = useState<PlayerStatus>("tentative");
  const [acceptedTwo, setAcceptedTwo] = useState<PlayerStatus>("tentative");
  const [gameId, setGameId] = useState<string>();
  const [createdGame, setCreatedGame] = useState<IMultiplayerGame | null>(null);
  const [instanceStatus, setInstanceStatus] =
    useState<InstanceStatus>("waiting");

  /* Fetch queued players and broadcast on channel
   * This function ensures everyone is aware of who is queued and not.
   * It records how many players are queued. */
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
          setPlayerOne(data[0].queued_player_id);
          setPlayerTwo(data[1].queued_player_id);
          setGameId(uuidv4());

          await facilitateMatch(); // Once queued player >= 2 we begin here,
        }
      };

      fetchPlayers();
    }
  }, [queuedCount]);

  // Function to facilitate the match, wait for both players to accept.
  const facilitateMatch = async () => {
    // Waiting for both player's to accept before creating game.
    await handleAcceptPrompt();
    if (acceptedOne && acceptedTwo) {
      const { error } = await supabase
        .from("games")
        .insert([
          {
            game_id: gameId,
            instance_status: instanceStatus,
            player_id_red: playerOne,
            player_id_green: playerTwo,
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
          game_id: gameId,
          instance_status: instanceStatus,
          player_id_red: playerOne,
          red_ready: acceptedOne,
          player_id_green: playerTwo,
          green_ready: acceptedTwo,
          move_number: 0,
          made_move: "",
          board: "",
          current_player: "red",
          game_status: "inProgress",
          game_creator: "-", // TODO: Delete this
          player_count: 2, // TODO: Delete this
        };
        setCreatedGame(newGame);
        console.log("Both players have accepted, navigating to game...");
        navigate(`/game/${gameId}`);
      }
    }

    // Listen to players loaded into the matchmaker
    const matchChannel = supabase
      .channel(`game-status:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        (payload) => {
          const newStatus = payload.new as IMultiplayerGame;
          if (newStatus) {
            setPlayerOne(newStatus.player_id_red);
            setPlayerTwo(newStatus.player_id_green);
          }
        },
      )
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
    };
  };

  // Handling users accepting or not.
  const handleAcceptPrompt = async () => {
    if (user?.id === playerOne || user?.id === playerTwo) {
      console.log("Proceeding...");
    } else {
      console.log("Returning...");
      return;
    }

    const accept = window.confirm("Match found! Accept?");

    if (accept) {
      if (playerOne === user.id) {
        setAcceptedOne("ready");
        const { error } = await supabase
          .from("games")
          .update({
            instance_status: instanceStatus,
            red_ready: acceptedOne,
          })
          .eq("game_id", gameId);

        if (error) {
          console.error("Error updating game status: ", error);
        }
      } else if (playerTwo === user.id) {
        setAcceptedTwo("ready");
        const { error } = await supabase
          .from("games")
          .update({
            instance_status: instanceStatus,
            green_ready: acceptedTwo,
          })
          .eq("game_id", gameId);

        if (error) {
          console.error("Error updating game status: ", error);
        }
      }

      // Listen to players accepting the match
      const acceptChannel = await supabase
        .channel(`match:${gameId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "games" },
          (payload) => {
            const acceptStatus = payload.new as IMultiplayerGame;
            if (acceptStatus) {
              setAcceptedOne(acceptStatus.red_ready);
              setAcceptedTwo(acceptStatus.green_ready);
            }
          },
        )
        .subscribe();

      return () => {
        acceptChannel.unsubscribe();
      };
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
        <li>
          {user ? (
            <div>
              User {user.id}
              <Button onClick={handleAcceptPrompt}>Queue</Button>
            </div>
          ) : (
            <div>No logged in user.</div>
          )}
        </li>
      </ul>
      {/* Button to join the queue */}
      {/* Other UI components */}
    </div>
  );
};

export default Queue;
