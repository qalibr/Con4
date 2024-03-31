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

interface MatchFound {
  redPlayerId: string;
  greenPlayerId: string;
  redPlayerAccepted?: boolean;
  greenPlayerAccepted?: boolean;
}

const Queue = () => {
  const { user } = useAuth();

  // Keep track of queue entries.
  const [queuedPlayers, setQueuedPlayers] = useState<IQueuedPlayer[]>([]);
  const [matchFound, setMatchFound] = useState<MatchFound | null>(null);
  const [showConfirmationDialogue, setShowConfirmationDialogue] =
    useState(false);
  const [confirmationCountdown, setConfirmationCountdown] = useState<number>(0);

  // Player and TokenBoard.
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [inGame, setInGame] = useState<boolean>(false);

  useEffect(() => {
    /*
     * Fetch queuedPlayers */
    const fetchQueuedPlayers = async () => {
      const { data, error } = await supabase
        .from("queue")
        .select("*")
        .eq("queue_entry_status", "queued"); // "queued" denotes a player waiting for a match.

      if (error) {
        console.error("Error fetching queue:", error);
      } else {
        setQueuedPlayers(data); // Keep track of status
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
          fetchQueuedPlayers(); // Fetch players again when a change is detected.
        },
      )
      .subscribe();

    return () => {
      queueStatusChannel.unsubscribe();
    };
  }, [matchFound]);

  useEffect(() => {
    /*
     * Attempt to create game instance */
    const matchQueuedPlayers = async () => {
      if (queuedPlayers.length < 2) return;

      // Assign ID's
      const redPlayerId = queuedPlayers[0].queued_player_id;
      const greenPlayerId = queuedPlayers[1].queued_player_id;

      if ([redPlayerId, greenPlayerId].includes(user?.id as string)) {
        setMatchFound({ redPlayerId, greenPlayerId });
        setShowConfirmationDialogue(true);
      }

      // If user is either red/green proceed to update their status.
      if (user?.id === redPlayerId || user?.id === greenPlayerId) {
        for (const playerId of [redPlayerId, greenPlayerId]) {
          const { error } = await supabase
            .from("queue")
            .update({
              queue_entry_status: "",
            })
            .eq("queued_player_id", playerId);

          if (error) {
            console.error(`Couldn't update queue status of ${playerId}`, error);
            continue;
          }

          if (user.id === playerId) {
            console.log(`Setting up player: ${playerId}`);
            setInGame(true);
          }
        }
      }
    };

    matchQueuedPlayers();
  }, [queuedPlayers, user?.id]);

  /*
   * A timeout effect to clear the matchFound state if it runs for longer than 30 seconds, or clear in case
   * either player declines. */
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (showConfirmationDialogue) {
      setConfirmationCountdown(30);
      timerId = setInterval(async () => {
        setConfirmationCountdown((prevCountdown) => {
          const updatedCountdown = prevCountdown - 1;
          if (updatedCountdown <= 0) {
            clearInterval(timerId);
            playerMatchDeclined();
          }
          return updatedCountdown;
        });
        const { data, error } = await supabase
          .from("queue")
          .select("queue_entry_status")
          .eq("queued_player_id", user?.id)
          .single();

        if (error) {
          console.error("Error checking user status:", error);
          return;
        }

        // If the status is 'declined', clear the timer and reset relevant states.
        if (data?.queue_entry_status === "declined") {
          clearInterval(timerId!);
          setShowConfirmationDialogue(false);
          setMatchFound(null);
        }
      }, 1000);
    }

    return () => clearInterval(timerId);
  }, [showConfirmationDialogue, user?.id]);

  /*
   * Set both player's status as "declined" */
  const playerMatchDeclined = async () => {
    for (const playerId of [
      matchFound?.redPlayerId,
      matchFound?.greenPlayerId,
    ]) {
      if (!playerId) continue;
      await supabase
        .from("queue")
        .update({
          queue_entry_status: "declined",
        })
        .eq("queued_player_id", playerId);
    }

    // If either player declines, reset matchFound and confirmation dialogue states.
    setShowConfirmationDialogue(false);
    setMatchFound(null);
  };

  const playerMatchAccepted = async () => {
    for (const playerId of [
      matchFound?.redPlayerId,
      matchFound?.greenPlayerId,
    ]) {
      if (!playerId) continue;
      await supabase
        .from("queue")
        .update({
          queue_entry_status: "accepted",
        })
        .eq("queued_player_id", user?.id);
    }
    setShowConfirmationDialogue(false);
  };

  /*
   * Handling confirmation dialogue and handing over to game function. */
  const handleConfirmationDialogue = async (accept: boolean) => {
    setShowConfirmationDialogue(false);

    // Return early if matchFound is null for some reason...
    if (!matchFound) {
      console.log("matchFound was null, returning...");
      playerMatchDeclined();
      return;
    }

    // TODO: When both accept it doesn't proceed. FIX THAT.

    // Player accepts. Update matchFound with accept status state of the players.
    const updatedMatchFound = { ...matchFound };
    if (user?.id === matchFound.redPlayerId)
      updatedMatchFound.redPlayerAccepted = true;
    if (user?.id === matchFound.greenPlayerId)
      updatedMatchFound.greenPlayerAccepted = true;

    console.log("Updated red: ", updatedMatchFound.redPlayerAccepted);
    console.log("Updated green: ", updatedMatchFound.greenPlayerAccepted);

    // If a player declines, clear statuses and end match...
    if (!accept) {
      console.log("A player declined, ending match...");
      await playerMatchDeclined();
      return;
    } else if (accept) {
      console.log(`A player accepted: ${user?.id}`);
      await playerMatchAccepted();
    }

    // Check if both players have accepted. If so, set up the game.
    if (
      updatedMatchFound.redPlayerAccepted &&
      updatedMatchFound.greenPlayerAccepted
    ) {
      console.log("Both players have accepted, setting up game...");
      await setupGame(matchFound.redPlayerId, matchFound.greenPlayerId);
      setInGame(true);
      setMatchFound(null); // Clear matchFound after setup is complete.
    } else {
      console.log("Waiting for other player's response...");
      setMatchFound(updatedMatchFound); // Update matchFound with current acceptances.
    }
  };

  const setupGame = async (redPlayerId: string | undefined, greenPlayerId: string | undefined) => {
    // Update the queue entry status to "accept" for both players to proceed with the game setup.
    for (const playerId of [redPlayerId, greenPlayerId]) {
      const { error } = await supabase
        .from("queue")
        .update({
          queue_entry_status: "accept",
        })
        .eq("queued_player_id", playerId);

      if (error) {
        console.error(
          `Couldn't update the queue status for ${playerId}`,
          error,
        );
      }
    }
  };

  /* This function allows a player to enter the queue.
   * "queued_player_id" column is set as unique, so players who are queued cannot re-queue. */
  const handleEnterQueue = async () => {
    if (!user) return;

    // Insert record
    const { data, error } = await supabase
      .from("queue")
      .insert([
        { queued_player_id: user.id, queue_entry_status: "queued" }, // Initial value is "queued"
      ])
      .select();

    if (error) {
      // Upon error, due to unique constraint for user.id --> Update record instead
      /* * */
      /* * */
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
              {queuedPlayers.some((p) => p.queued_player_id === user.id) ? (
                <p>You are in queue</p>
              ) : (
                <Button onClick={handleEnterQueue}>Queue</Button>
              )}
            </div>
          ) : (
            <div>No logged in user.</div>
          )}
        </li>
      </ul>
      {showConfirmationDialogue && (
        <div>
          {/* This is a simplistic representation. Replace with your dialog/modal component */}
          <p>
            A match has been found! Do you accept? Timer:{" "}
            {confirmationCountdown}
          </p>
          <button onClick={() => handleConfirmationDialogue(true)}>
            Accept
          </button>
          <button onClick={() => handleConfirmationDialogue(false)}>
            Decline
          </button>
        </div>
      )}
    </div>
  );
};

export default Queue;
