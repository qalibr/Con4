import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button.tsx";

import {
  TokenBoard,
  QueueEntry,
  QueueStatus,
  MatchEntry,
} from "@/confourComponents/game/types.tsx";
import { generateEmptyBoard } from "@/confourComponents/game/game-logic.tsx";

const Queue = () => {
  const { user } = useAuth();

  /* NOTE: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  These state variables are related to the "queue" table... */
  const [currentQueueEntry, setCurrentQueueEntry] = useState<QueueEntry[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [redId, setRedId] = useState<string | null>(null);
  const [greenId, setGreenId] = useState<string | null>(null);
  const [redReady, setRedReady] = useState<boolean>(false);
  const [greenReady, setGreenReady] = useState<boolean>(false);

  /* NOTE: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  Related to "matches" table... */
  const [matches, setMatches] = useState<MatchEntry | null>(null);

  /*
   * Gen empty board when enterMatch executes... */
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());

  /* NOTE: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  Useful state variables to control the flow of the app... */
  const [isQueued, setIsQueued] = useState<boolean>(false);
  const [matchFound, setMatchFound] = useState<boolean>(false);
  const [isInMatch, setIsInMatch] = useState<boolean>(false);
  /*
   * If a user declines the match use this state variable to control the notification informing the other user of this... */
  const [declineMatch, setDeclineMatch] = useState<boolean>(false);

  /* QUEUE
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

        if (fetchError) throw fetchError;

        // NOTE: Fetching all queue data, and then look for current user.
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        const userQueueEntry = queueData.find(
          (entry) => entry.red_id === user.id || entry.green_id === user.id,
        );

        if (userQueueEntry) {
          setCurrentQueueEntry(userQueueEntry);
          setIsQueued(true);
          setMatchId(userQueueEntry.match_id);
          setRedId(userQueueEntry.red_id);
          setGreenId(userQueueEntry.green_id);
          setQueueStatus(userQueueEntry.queue_status);
          setRedReady(userQueueEntry.red_ready);
          setGreenReady(userQueueEntry.green_ready);

          // Match found?
          setMatchFound(!!(userQueueEntry.red_id && userQueueEntry.green_id));

          // Enter match if both players are ready...
          if (userQueueEntry.red_ready && userQueueEntry.green_ready) {
            enterMatch(
              userQueueEntry.match_id,
              userQueueEntry.red_id,
              userQueueEntry.green_id,
            );
          }
        } else {
          setIsQueued(false);
          setMatchFound(false);
        }
        console.log("- - - - - - - - - - - - - - - - -");
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
          const updateId = payload.new as QueueEntry;
          if (updateId) {
            setMatchId(updateId.match_id);
            setRedId(updateId.red_id);
            setGreenId(updateId.green_id);
            setQueueStatus(updateId.queue_status);
            setRedReady(updateId.red_ready);
            setGreenReady(updateId.green_ready);
          }

          if (declineMatch) {
            console.log("User declined match, returning to lobby...");
            setDeclineMatch(false); // Reset...
          }
        },
      )
      .subscribe();

    return () => {
      queueChannel.unsubscribe();
    };
  }, [user]);

  /* MATCH
   * Update user state variables for conditional rendering... */
  useEffect(() => {
    if (!user) return;

    const fetchingMatchEntries = async () => {
      try {
        const { data: matchData, error: fetchError } = await supabase
          .from("matches")
          .select("*");

        if (fetchError) throw fetchError;

        const userMatchData = matchData.find(
          (entry) => entry.red_id === user.id || entry.green_id === user.id,
        );

        if (userMatchData) {
          setMatches(userMatchData);
          setMatchId(userMatchData.match_id);
          setIsInMatch(true);
          console.log("Match id: ", userMatchData.match_id);
        }
      } catch (error) {
        console.error("Error while fetching match entries...", error);
      }
    };

    fetchingMatchEntries();

    const matchChannel = supabase
      .channel(`matches`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          console.log("Matches changed", payload);
          fetchingMatchEntries();
          const updateId = payload.new as MatchEntry;
          if (updateId) {
            setMatchId(updateId.match_id);
            setIsInMatch(updateId.match_status);
          }
        },
      )
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
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
        red_status: true,
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
          green_status: true,
          queue_status: "2",
        },
      ])
      .eq("match_id", matchId);

    if (error) {
      console.error("Error inserting new entry to 'queue' table: ", error);
    } else {
      setIsQueued(true);
    }
  };

  /*
   * Function to join the queue */
  const handleEnterQueue = async () => {
    if (!user) return;

    // Fetch all queue entries with value "1" indicating there is an open spot
    const { data: queueEntries, error } = await supabase
      .from("queue")
      .select("*")
      .eq("queue_status", "1");

    if (error) {
      console.error("Error fetching queue entries: ", error);
      return;
    }

    // Identifying the open entry the user can join, if it exists.
    const entryToJoin = queueEntries.find(
      (entry) => entry.red_id !== user.id && !entry.green_id,
    );

    if (entryToJoin) {
      await joinEntry(entryToJoin.match_id);
      console.log("Joining entry: ", entryToJoin.match_id);
    } else {
      // If no open entry exists, create a new one...
      await createEntry();
      console.log("No open entries found, creating new...");
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
  const acceptPlayerReady = async (matchId: string, playerId: string) => {
    if (!matchId || !playerId) return;

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
   * This function needs to:
   * 1. End the queue by deleting the entry
   * 2. Notify the other user that the match was declined */
  const declinePlayerReady = async (matchId: string, playerId: string) => {
    if (!matchId || !playerId) return;

    try {
      const match = await supabase
        .from("queue")
        .select("*")
        .eq("match_id", matchId)
        .single();

      if (match.error) throw match.error;

      const { error: deleteError } = await supabase
        .from("queue")
        .delete()
        .match({ match_id: matchId });

      if (deleteError) throw deleteError;

      console.log("Player declined, deleted the entry...");
      setDeclineMatch(true);
    } catch (error) {
      console.error("Error while attempting to delete queue entry", error);
    }
  };

  /*
   * This function will enter match, meaning it will create an entry in "matches" table,
   * then it will delete the previous record in the "queue" table, if successful. */
  // TODO: Flow not checked, older function
  const enterMatch = async (
    matchId: string | null,
    redId: string | null,
    greenId: string | null,
  ) => {
    if (!user || !redId || !greenId || !matchId) return;

    // Converting to JSON format before inserting, this way we can maintain the array format we need
    // when we retrieve the record later by parsing it.
    const jsonBoard = JSON.stringify(board);

    const matchEntry: MatchEntry = {
      match_id: matchId,
      match_status: true,
      game_status: "inProgress", // Initial "inProgress"... others "draw", "red", "green"...
      red_id: redId,
      green_id: greenId,
      move_number: 0,
      made_move: undefined,
      board: jsonBoard,
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
      {/*<h2>Queue Status</h2>*/}
      {!isQueued && !isInMatch && (
        <Button onClick={handleEnterQueue} className="m-4">
          Join Queue
        </Button>
      )}

      {isQueued && !matchFound && (
        <p className="m-4">
          You are currently in the queue. Please wait for your match to start.
        </p>
      )}

      {user &&
        isQueued &&
        matchFound &&
        ((user.id === redId && !redReady) ||
          (user.id === greenId && !greenReady)) && (
          <div>
            <p>Found match!</p>

            <Button
              onClick={() =>
                matchId && user && acceptPlayerReady(matchId, user.id)
              }
              className="m-4"
            >
              Accept
            </Button>
            <Button
              onClick={() =>
                matchId && user && declinePlayerReady(matchId, user.id)
              }
              className="m-4"
            >
              Decline
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

      {/* Render information about the current match if the user is in one... */}
      {isInMatch && matches && (
        <div>
          <h3>Current Match</h3>
          <p>Match ID: {matches.match_id}</p>
        </div>
      )}
    </div>
  );
};

export default Queue;
