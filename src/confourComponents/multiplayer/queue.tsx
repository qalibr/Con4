import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button.tsx";

import { IMultiplayerGame } from "@/confourComponents/multiplayer/IMultiplayerGame.tsx";
import { IQueuedPlayer } from "@/confourComponents/multiplayer/IQueuedPlayer.tsx";
import {
  InstanceStatus,
  PlayerStatus,
  QueuedPlayerStatus,
} from "@/confourComponents/multiplayer/multiplayer-types.tsx";
import {
  GameStatus,
  Player,
  TokenBoard,
} from "@/confourComponents/game/types.tsx";
import { generateEmptyBoard } from "@/confourComponents/game/game-logic.tsx";

const Queue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Keep track of queue entries.
  const [queuedPlayers, setQueuedPlayers] = useState<IQueuedPlayer[]>([]);

  // Keep track of how many players are queued.
  const [queuedCount, setQueuedCount] = useState(0);

  // Queued player status. "queued", "accept", "decline"
  const [queuedPlayerStatus, setQueuedPlayerStatus] =
    useState<QueuedPlayerStatus>("queued");

  // Variables to store player IDs
  const [redPlayerID, setRedPlayerID] = useState<string>("");
  const [greenPlayerID, setGreenPlayerID] = useState<string>("");

  // Variables to store player status. "tentative", "ready", "declined"
  const [redReady, setRedReady] = useState<PlayerStatus>("tentative");
  const [greenReady, setGreenReady] = useState<PlayerStatus>("tentative");

  // Subject to change
  const [gameId, setGameId] = useState<string>();

  // Variables to store what is relevant to the games.
  const [createdGame, setCreatedGame] = useState<IMultiplayerGame | null>(null);

  // Game status. "inProgress", "red", "green", "draw"
  const [gameStatus, setGameStatus] = useState<GameStatus>("inProgress");

  // Player and TokenBoard.
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");

  // Instance status. "waiting", "active", "ended"
  const [instanceStatus, setInstanceStatus] =
    useState<InstanceStatus>("waiting");

  useEffect(() => {
    /* Fetch queued players and broadcast on channel
     * This function ensures everyone is aware of who is queued and not.
     * It records how many players are queued. */
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

  /* This function allows a player to enter the queue.
   * "queued_player_id" column is set as unique, so players who are queued cannot re-queue.
   * To ensure smooth user experience:
   * 1. Update record when player accepts to enter a game following a popup.
   * 2. Update record when the player presses the queue button. */
  const handleEnterQueue = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("queue")
      .insert([
        { queued_player_id: user.id, queue_entry_status: queuedPlayerStatus }, // Initial value is "queued"
      ])
      .select();

    if (error) {
      // Update record instead
      const { data, error } = await supabase
        .from("queue")
        .update({ queue_entry_status: "queued" }) // Setting this to "queued". Not expecting problems from that, when the player presses Queue he wants to queue.
        .eq("queued_player_id", user.id)
        .select();
      if (error) {
        console.error(
          "Failed to insert and then to update queue status: ",
          error,
        );
      }
    } else {
      console.log(
        "Player: '",
        user.id,
        "' entered into queue successfully.\n",
        data,
      );
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
              {/*User {user.id}*/}
              <Button onClick={handleEnterQueue}>Queue</Button>
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
