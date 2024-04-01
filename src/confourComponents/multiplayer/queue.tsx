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
  match_id: string;
  red_id: string;
  red_status: QueuePlayerStatus;
  green_id: string;
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
  const [matchId, setMatchId] = useState<string>("");
  const [redId, setRedId] = useState<string>("");
  const [greenId, setGreenId] = useState<string>("");
  // const [showDialog, setShowDialog] = useState(false);
  // const [confirmationCountdown, setConfirmationCountdown] = useState<number>(0);
  // // Player and TokenBoard.
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  // const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  // const [inGame, setInGame] = useState<boolean>(false);

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
    if (!user) return;

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
      }
    };

    fetchMatchId();

    if (matchId) {
      console.log("Attempting to enter match... matchId: ", matchId);
      enterMatch(matchId, redId, greenId);
    }

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
  };

  /*
   * Function to join an existing entry in the "queue" table... */
  const joinEntry = async (matchId: string) => {
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
  };

  /*
   * Function to join the queue */
  const handleQueueAction = async () => {
    if (!user) return;
    // BUG: It should not be possible for a user to be in more than one record. Must fix this bug.

    const entryToJoin = queueEntries.find(
      (entry) => entry.queue_status === "1" && entry.red_id !== user.id,
    );

    if (entryToJoin) {
      await joinEntry(entryToJoin.match_id); // Pass the match_id
    } else {
      await createEntry();
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

    setMatches(matchEntry);
  };

  return (
    <div>
      <h2>Entries: {queueEntries.length}</h2>
      <Button onClick={handleQueueAction} className="m-4">
        {" "}
        Queue{" "}
      </Button>
    </div>
  );
};

export default Queue;
