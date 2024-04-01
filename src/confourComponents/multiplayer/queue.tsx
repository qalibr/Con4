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

interface Match {
  match_id: string;
  match_status: MatchStatus;
  game_status: GameStatus;
  red_id: string;
  green_id: string;
  move_number: number;
  made_move: string;
  board: string;
  current_player: Player;
}

const Queue = () => {
  const { user } = useAuth();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [matches, setMatches] = useState<Match | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [confirmationCountdown, setConfirmationCountdown] = useState<number>(0);
  // Player and TokenBoard.
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [inGame, setInGame] = useState<boolean>(false);

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
        },
      )
      .subscribe();

    return () => {
      queueChannel.unsubscribe();
    };
  }, [user]);

  // TODO: Create effect to fetch rows with red_status and green_status as "queued"

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
    }
  };

  /*
  * Function to join the queue */
  const handleQueueAction = async () => {
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

  return (
    <div>
      <h2>Entries: {queueEntries.length}</h2>
      <Button onClick={handleQueueAction} className="m-4"> Queue </Button>
    </div>
  );
};

export default Queue;
