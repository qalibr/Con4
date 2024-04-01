import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "@/confourHooks/useAuth.tsx";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button.tsx";

import { IMultiplayerGame } from "@/confourComponents/multiplayer/IMultiplayerGame.tsx";
import {
  InstanceStatus,
  PlayerStatus,
} from "@/confourComponents/multiplayer/multiplayer-types.tsx";
import {
  GameStatus,
  Player,
  TokenBoard,
} from "@/confourComponents/game/types.tsx";
import { generateEmptyBoard } from "@/confourComponents/game/game-logic.tsx";
import { Simulate } from "react-dom/test-utils";
import error = Simulate.error;

type QueueStatus = "1" | "2" | null;
type QueuePlayerStatus =
  | "queued"
  | "accepted"
  | "declined"
  | "timeout"
  | ""
  | null;
type MatchStatus = "active" | "ended" | "tentative" | null;

interface QueueEntry {
  match_id: string | null;
  red_id: string | null;
  red_status: QueuePlayerStatus;
  green_id: string | null;
  green_status: QueuePlayerStatus;
  queue_status: QueueStatus;
  red_ready: boolean;
  green_ready: boolean;
}

interface MatchEntry {
  match_id: string;
  match_status: MatchStatus;
  game_status: GameStatus;
  red_id: string;
  green_id: string;
  move_number: number;
  made_move: string;
  board: TokenBoard;
  current_player: Player;
}

const Queue = () => {
  const { user } = useAuth();
  const [currentQueueEntry, setCurrentQueueEntry] = useState<QueueEntry[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(null);
  const [matches, setMatches] = useState<MatchEntry | null>(null);
  const [matchId, setMatchId] = useState<string | null>("");
  const [redId, setRedId] = useState<string | null>("");
  const [greenId, setGreenId] = useState<string | null>("");
  const [playersAreReady, setPlayersAreReady] = useState<boolean>(false);
  const [isQueued, setIsQueued] = useState<boolean>(false);
  const [matchFound, setMatchFound] = useState<boolean>(false);
  const [isInMatch, setIsInMatch] = useState<boolean>(false);
  // const [confirmationCountdown, setConfirmationCountdown] = useState<number>(0);
  // // Player and TokenBoard.
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  // const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  // const [inGame, setInGame] = useState<boolean>(false);

  /*
   * Update user state variables for conditional rendering... */
  useEffect(() => {
    if (!user) return;

    /*
     * Fetching the entire table... */
    const fetchingEntries = async () => {
      try {
        const { data: queueData, error: fetchError } = await supabase
          .from("queue")
          .select("*");

        if (fetchError) {
          throw error;
        }
        // NOTE: Fetching all queue data, and then look for current user.
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        setCurrentQueueEntry(queueData);

        // NOTE: See if current user is queued...
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        const userIsQueued = queueData.some(
          (entry) => entry.red_id === user.id || entry.green_id === user.id,
        );
        setIsQueued(userIsQueued);
        console.log("userIsQueued: ", userIsQueued);

        // NOTE: The queue status?
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        const queueStatus2 = queueData.some(
            (entry) => entry.red_id !== null && entry.green_id !== null
        );
        const queueStatus1 = queueData.some(
            (entry) => entry.red_id !== null && entry.green_id === null ||
                entry.red_id === null && entry.green_id !== null
        );
        if (queueStatus2) {
          setQueueStatus("2");
        } else if (queueStatus1) {
          setQueueStatus("1");
        } else {
          setQueueStatus(null);
        }
        console.log("Queue status: ", queueStatus);

        // NOTE: Match found?..
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        const usersMatchFound = queueData.some(
          (entry) => entry.red_id && entry.green_id,
        );
        setMatchFound(usersMatchFound);
        console.log("usersMatchFound: ", usersMatchFound);

        // NOTE: Current user matched against another user?..
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        const usersMatched = queueData.some(
          (entry) => entry.red_id !== null && entry.green_id !== null,
        );
        setMatchFound(usersMatched);
        console.log("usersMatched: ", usersMatched);

        // NOTE: Both users marked as ready?..
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        const usersMarkedReady = queueData.some(
          (entry) => entry.red_ready && entry.green_ready,
        );
        setPlayersAreReady(usersMarkedReady);
        console.log("Players are ready: ", usersMarkedReady);

        // TODO: Maybe not do this stuff with the "matches" table?
        //  Remove this, make a new file match.tsx to handle the game instance
        //  and let this queue file handle the whole process of getting there...
        // NOTE: Fetching match data specific to current user.
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        const matchData = await fetchMatchDataForUser(user.id);
        const userIsInMatch = matchData.some(
          (entry: { red_id: null; green_id: null }) =>
            entry.red_id !== null && entry.green_id !== null,
        );
        console.log("userMatchFound: ", userIsInMatch);
        setIsInMatch(userIsInMatch);
      } catch (error) {
        // console.error("Error fetching queue table...");
      }
    };

    fetchingEntries();

    const queueChannel = supabase

      .channel(`queue`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        (payload) => {
          console.log("Queue changed: ", payload);
          fetchingEntries();

          // TODO: Is this needed? Probably not.
          const updateId = payload.new as QueueEntry;
          if (updateId) {
            setMatchId(updateId.match_id);
            setRedId(updateId.red_id);
            setGreenId(updateId.green_id);
          }
        },
      )
      .subscribe();

    return () => {
      queueChannel.unsubscribe();
    };
  }, [user]);

  /*
   * A function to create a new entry in the "queue" table... */
  const createEntry = async () => {
    if (!user) return;
    const newMatchId = uuidv4();

    const { error } = await supabase.from("queue").insert([
      {
        match_id: newMatchId,
        red_id: user.id,
        red_status: "queued",
        green_id: null,
        green_status: null,
        queue_status: "1",
      },
    ]);

    if (error) {
      console.error("Error inserting new entry to 'queue' table: ", error);
      return;
    }

    setIsQueued(true);
  };

  /*
   * Function to join an existing entry in the "queue" table... */
  const joinEntry = async (matchId: string | null) => {
    if (!user || !matchId) return;

    const { error } = await supabase
      .from("queue")
      .update([
        {
          green_id: user.id,
          green_status: "queued",
          queue_status: "2",
        },
      ])
      .eq("match_id", matchId);

    if (error) {
      console.error("Error inserting new entry to 'queue' table: ", error);
      return;
    }

    setIsQueued(true);
  };

  /*
   * Function to join the queue */
  const handleEnterQueue = async () => {
    if (!user) return;

    const entryToJoin = currentQueueEntry.find(
      (entry) => entry.queue_status === "1" && entry.red_id !== user.id,
    );

    if (entryToJoin) {
      await joinEntry(entryToJoin.match_id); // Pass the match_id
    } else {
      await createEntry();
    }
  };

  const handleLeaveQueue = async () => {
    if (!user || !matchId) return; // Immediately return if user is not aware of any matchId...

    const { data: queueEntry, error: fetchError } = await supabase
      .from("queue")
      .select("*")
      .eq("match_id", matchId)
      .single();

    if (fetchError || !queueEntry) {
      console.error("Error fetching queue entry: ", fetchError);
      return;
    }

    let playerCount: number = 0;
    if (queueEntry.red_id) playerCount++;
    if (queueEntry.green_id) playerCount++;

    if (playerCount <= 1) {
      const { error: deleteError } = await supabase
        .from("queue")
        .delete()
        .match({ match_id: matchId });

      if (deleteError) {
        console.error("Error deleting queue entry: ", deleteError);
        return;
      }

      console.log("Queue entry deleted successfully...");
    } else {
      let updatePayload = {};

      if (queueEntry.red_id === user.id) {
        updatePayload = {
          red_id: null,
          red_status: null,
          queue_status: playerCount - 1,
        };
      } else if (queueEntry.green_id === user.id) {
        updatePayload = {
          green_id: null,
          green_status: null,
          queue_status: playerCount - 1,
        };
      }

      const { error: updateError } = await supabase
        .from("queue")
        .update(updatePayload)
        .eq("match_id", matchId);

      if (updateError) {
        console.error("Error updating queue entry: ", updateError);
      }

      console.log("Queue entry updated successfully...");
    }

    setIsQueued(false);
    setMatchFound(false);
  };

  /*
  * Function to mark players are ready... */
  const markPlayerReady = async (matchId: string, playerId: string) => {
    if (!user) return;

    try {
      const match = await supabase
        .from("queue")
        .select("*")
        .eq("match_id", matchId)
        .single();

      if (match.error) throw match.error;

      // Mark player ready in the updated payload.
      const updatePayload =
        match.data.red_id === playerId
          ? { red_ready: true }
          : { green_ready: true };

      const { error: updateError } = await supabase
        .from("queue")
        .update(updatePayload)
        .eq("match_id", matchId);

      if (updateError) throw updateError;

      console.log("Player marked as ready");
    } catch (error) {
      console.error("Error marking player as ready:", error);
    }
  };

  /*
  * TODO: Create function to decline a ready check when match is found,
  *  whereupon the player that declined is simply removed from the queue.
  *  Could also make it so the whole entry is destroyed and the function
  *  "handleEnterQueue" is called to re-queue the other person. */

  const checkIfPlayersReadyThenStartMatch = async (matchId: string) => {
    try {
      const { data: match, error: fetchError } = await supabase
        .from("matches")
        .select("*")
        .eq("match_id", matchId)
        .single();

      if (fetchError) throw fetchError;

      if (match.red_ready && match.green_ready) {
        // Both players are ready, proceed to start the match
        console.log("Both players are ready, starting match...");
        enterMatch(match.match_id, match.red_id, match.green_id);
      } else {
        console.log("Waiting for both players to be ready...");
      }
    } catch (error) {
      console.error("Error checking match readiness:", error);
    }
  };

  /*
   * This function will enter match, meaning it will create an entry in "matches" table,
   * then it will delete the previous record in the "queue" table, if successful. */
  const enterMatch = async (
    matchId: string,
    redId: string,
    greenId: string,
  ) => {
    if (!user) return;

    const matchEntry: MatchEntry = {
      match_id: matchId,
      match_status: "active",
      game_status: "inProgress",
      red_id: redId,
      green_id: greenId,
      move_number: 0,
      made_move: "",
      board: board,
      current_player: "red",
    };

    // Insert new entry to "matches" table...
    const { data: insertData, error: insertError } = await supabase
      .from("matches")
      .insert(matchEntry);

    // Make sure nothing went wrong, if it did we return to avoid losing data...
    if (insertError) {
      console.error(
        "Error inserting new entry to 'queue' table: ",
        insertError,
      );
      return;
    } else {
      console.log("Matches entry successfully inserted... ", insertData);
    }

    // Perform the deletion...
    const { error: deleteError } = await supabase
      .from("queue")
      .delete()
      .match({ match_id: matchId });

    if (deleteError) {
      console.error("Error deleting queue entry: ", deleteError);
      return;
    } else {
      console.log("Queue entry successfully deleted...");
    }

    setIsQueued(false);
    setMatchFound(false);
    setIsInMatch(true);
    setMatches(matchEntry);
  };

  const fetchMatchDataForUser = async (uid: string) => {
    let queryCondition = null;
    if (uid) {
      queryCondition = `red_id.eq.${uid},green_id.eq.${uid}`;
    }

    if (queryCondition) {
      try {
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select("*")
          .or(queryCondition)
          .single();

        if (matchError) throw matchError;

        if (matchData) {
          console.log("Fetching match data was successful...");
          setMatchFound(true);
          return matchData;
        } else {
          console.log("No current match for the user.");
          setMatchFound(false);
        }
      } catch (error) {
        console.error("Fetching match data failed...", error);
      }
    } else {
      console.log("Invalid user IDs...");
      setMatchFound(false);
    }
  };

  return (
    <div>
      <h2>Queue Status</h2>
      {!isQueued && !isInMatch && (
        <Button onClick={handleEnterQueue} className="m-4">
          Join Queue
        </Button>
      )}
      {isQueued && (
        <p>
          You are currently in the queue. Please wait for your match to start.
        </p>
      )}
      {isQueued && matchFound && (
        <div>
          <p>Found match. Please press Ready to start.</p>
          <Button
            onClick={() => matchId && user && markPlayerReady(matchId, user.id)}
            className="m-4"
          >
            Ready
          </Button>
        </div>
      )}
      {isInMatch && <p>You are currently in a match.</p>}

      {/* Conditionally render a leave queue button if the user is in the queue but not yet in a match */}
      {isQueued && !matchFound && (
        <Button onClick={handleLeaveQueue} className="m-4">
          Leave Queue
        </Button>
      )}

      {/* Optionally, render information about the current match if the user is in one */}
      {isInMatch && matches && (
        <div>
          <h3>Current Match</h3>
          <p>Match ID: {matches.match_id}</p>
          {/* Additional match details here */}
        </div>
      )}
    </div>
  );
};

export default Queue;
