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
  const [queuedCount, setQueuedCount] = useState<number>(0);

  // Queued player status. "queued", "accept", "decline"
  const [queuedPlayerStatus, setQueuedPlayerStatus] =
    useState<QueuedPlayerStatus>("queued");

  // Player and TokenBoard.
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");

  const [inGame, setInGame] = useState(false);
  const [redId, setRedId] = useState<string>();
  const [greenId, setGreenId] = useState<string>();

  useEffect(() => {
    /*
     * Attempt to create game instance */
    const matchQueuedPlayers = async () => {
      if (queuedCount >= 2 && queuedPlayers.length >= 2) {
        // Assign ID's
        const redPlayerId = queuedPlayers[0].queued_player_id;
        const greenPlayerId = queuedPlayers[1].queued_player_id;
        setRedId(redPlayerId);
        setGreenId(greenPlayerId);

        // If user is either red/green proceed to update their status.
        // Setting up Red
        if (user?.id === redId) {
          const { error } = await supabase
              .from("queue")
              .update({
                queue_entry_status: "accept",
              })
              .eq("queued_player_id", redId)
              .select();

          if (error) {
            console.error("Failed to update entry in table: ", error);
          } else {
            // If the update was successful, proceed to the game.
            console.log("Setting up red.");
            setInGame(true);
          }
        }
        // Setting up Green
        else if (user?.id === greenId) {
          const { error } = await supabase
              .from("queue")
              .update({
                queue_entry_status: "accept",
              })
              .eq("queued_player_id", greenId)
              .select();

          if (error) {
            console.error("Failed to update entry in table: ", error);
          } else {
            // If the update was successful, proceed to the game.
            console.log("Setting up green.");
            setInGame(true);
          }
        }
      }

      // TODO: Broadcast changes
    };

    matchQueuedPlayers();
  }, [greenId, queuedCount, queuedPlayers, redId, user]);

  useEffect(() => {
    /*
     * Fetch queuedPlayers and queuedCount */
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

    // Listening for realtime changes, any, on the "queue" table.
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

    // Insert record
    const { data, error } = await supabase
      .from("queue")
      .insert([
        { queued_player_id: user.id, queue_entry_status: queuedPlayerStatus }, // Initial value is "queued"
      ])
      .select();

    if (error) {
      // Upon error, due to unique constraint for user.id --> Update record instead
      /* * */
      /* * */
      /*
       * NOTE: Hardcoding "queued" here, make sure a player cannot queue when he shouldn't be able to. e.g. when he is in a game.
       *       TODO: Queue button conditional render depending upon queue_entry_status.
       *        1. Hide button when "queued" is active.
       *        2. Hide button when InstanceStatus is "active"? */
      const { data, error } = await supabase
        .from("queue")
        .update({ queue_entry_status: "queued" })
        .eq("queued_player_id", user.id)
        .select();

      if (error) {
        console.error(
          "Failed to insert and then to update queue status: ",
          error,
        );
      } else {
        console.log(
          "Player: '",
          user.id,
          "' updated queue record successfully.\n",
          data,
        );
      }
      /* * */
      /* * */
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
