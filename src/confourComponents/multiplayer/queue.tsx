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

type QueueStatus = "0" | "1" | "2" | "matched" | "failed" | "timeout" | null;
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
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [matches, setMatches] = useState<MatchEntry | null>(null);
  const [matchId, setMatchId] = useState<string | null>("");
  const [redId, setRedId] = useState<string | null>("");
  const [greenId, setGreenId] = useState<string | null>("");
  const [isQueued, setIsQueued] = useState<boolean>(false);
  const [isInMatch, setIsInMatch] = useState<boolean>(false);
  // const [showDialog, setShowDialog] = useState(false);
  // const [confirmationCountdown, setConfirmationCountdown] = useState<number>(0);
  // // Player and TokenBoard.
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  // const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  // const [inGame, setInGame] = useState<boolean>(false);

  /* 0.
   * Update user state variables for conditional rendering... */
  useEffect(() => {
    if (!user) return;
    const checkUserStatus = async () => {
      if (!isQueued) {
        const { data: queueData, error: queueError } = await supabase
          .from("queue")
          .select("*")
          .or(`red_id.eq.${user.id},green_id.eq.${user.id}`)
          .single();
        if (queueError) {
          console.error("Error fetching queue table...", queueError);
          return;
        }
        if (queueData.red_id !== null) {
          if (queueData.red_id === user.id) {
            setIsQueued(true); // NOTE
          }
        }
        if (queueData.green_id !== null) {
          if (queueData.green_id === user.id) {
            setIsQueued(true); // NOTE
          }
        }
      }
      if (!isInMatch) {
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select("*")
          .or(`red_id.eq.${user.id},green_id.eq.${user.id}`)
          .single();
        if (matchError) {
          console.error("Error fetching matches table...", matchError);
          return;
        }
        if (matchData.red_id !== null) {
          if (matchData.red_id === user.id) {
            setIsInMatch(true); // NOTE
          }
        }
        if (matchData.green_id !== null) {
          if (matchData.green_id === user.id) {
            setIsInMatch(true); // NOTE
          }
        }
      }
    };

    checkUserStatus();
  }, [isInMatch, isQueued]); // When a change is made to either, this effect is triggered.

  /* 1. Initial queueing...
   * Effect to fetch the queue table. */
  useEffect(() => {
    if (!user) return;

    const fetchQueueEntries = async () => {
      const { data, error } = await supabase
        .from("queue")
        .select("*")
        .or("queue_status.eq.1");

      if (error) {
        console.error("Error fetching queue table...", error);
      } else if (data) {
        setQueueEntries(data);
      }
    };

    fetchQueueEntries();

    const queueChannel = supabase
      .channel(`queue`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        (payload) => {
          console.log("Queue changed: ", payload);
          fetchQueueEntries();

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

  /* 2. Leaving queue and entering match...
   *  Effect to retrieve match_id and create entry in "matches" table */
  useEffect(() => {
    if (!user || !isQueued) return;

    const fetchMatchId = async () => {
      const { data, error } = await supabase
        .from("queue")
        .select("*")
        .or(`red_id.eq.${user.id},green_id.eq.${user.id}`)
        .single();
      if (error) {
        console.error("Error fetching match_id...", error);
        return;
      } else if (data) {
        setMatchId(data.match_id);
        setRedId(data.red_id);
        setGreenId(data.green_id);
        console.log("match_id: ", data.match_id);
        console.log("red_id: ", data.red_id);
        console.log("green_id: ", data.green_id);

        if (data.red_id !== null && data.green_id !== null) {
          console.log("Match could be generated here...");
        }
      }
    };

    fetchMatchId();

    const queueChannel = supabase
      .channel(`queue`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        (payload) => {
          console.log("Queue changed: ", payload);
          fetchMatchId();

          const updateId = payload.new as MatchEntry;
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
  }, [matchId, greenId, redId]);

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

    const entryToJoin = queueEntries.find(
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
    setIsInMatch(false);
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
    setIsInMatch(true);
    setMatches(matchEntry);
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
      {isInMatch && <p>You are currently in a match.</p>}

      {/* Conditionally render a leave queue button if the user is in the queue but not yet in a match */}
      {isQueued && !isInMatch && <Button onClick={handleLeaveQueue} className="m-4">Leave Queue</Button>}

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
