import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button.tsx";

import {
  TokenBoard,
  QueueEntry,
  QueueCount,
  MatchEntry,
  GameStatus,
  Player,
} from "@/confourComponents/game/types.tsx";
import {
  checkBoardState,
  generateEmptyBoard,
} from "@/confourComponents/game/game-logic.tsx";
import { Alert } from "@/components/ui/alert.tsx";

const Multiplayer = () => {
  const { user } = useAuth();
  const [entryId, setEntryId] = useState<number | undefined>(undefined); // The id of the row in Supabase.
  const [matchId, setMatchId] = useState<string | null>(null);
  const [redId, setRedId] = useState<string | null>(null);
  const [greenId, setGreenId] = useState<string | null>(null);

  /* ccc - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  These state variables are related to the "queue" table... */
  /*
   * Interface state variable corresponding to the 'queue' table */
  const [currentQueueEntry, setCurrentQueueEntry] = useState<QueueEntry[]>([]);
  const [queueCount, setQueueCount] = useState<QueueCount>(null);
  const [redReady, setRedReady] = useState<boolean>(false);
  const [greenReady, setGreenReady] = useState<boolean>(false);
  const [matchFound, setMatchFound] = useState<boolean>(false); // When two players are in the same row/entry

  /* ccc - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  Related to "matches" table... */
  /*
   * Interface state variable corresponding to the 'matches' table */
  const [matchEntry, setMatchEntry] = useState<MatchEntry | null>(null);
  /*
   * Games' status, to track the state of the game, in progress? draw? winner? */
  const [gameStatus, setGameStatus] = useState<GameStatus | Player>(
    "inProgress",
  );
  const [moveNumber, setMoveNumber] = useState<number>(0);
  const [madeMove, setMadeMove] = useState<Player>(null); // Whomsoever made the last mode
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red"); // red/green player
  const [matchStatus, setMatchStatus] = useState<boolean>(false); // True = both players are ready
  const [matchConcluded, setMatchConcluded] = useState<boolean>(false); // Render finished game and allow for cleanup
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());

  /* ccc - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  Useful state variables to control the flow of the app... */
  // Denotes if a player is queued or not
  const [isQueued, setIsQueued] = useState<boolean>(false);

  // Improve user experience with loading spinner
  const [loading, setLoading] = useState<boolean>(false);

  /* ccc - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  QUEUE
   *  Update user state variables for conditional rendering... */
  useEffect(() => {
    if (!user) return;
    // debugState("Start: useEffect(1)");

    // if match status is true, set queue and match found to false, and don't try to fetch queue table
    if (matchStatus) {
      setIsQueued(false);
      setMatchFound(false);
      setLoading(false);
      return;
    } else {
      setLoading(true); // So we don't keep loading during the actual game...
    }

    if (user.id === redId) console.log("\nYou are red.");
    if (user.id === greenId) console.log("\nYou are green.");

    /*
     * Fetching the entire table... */
    const fetchingEntries = async () => {
      try {
        const { data: queueData, error: fetchError } = await supabase
          .from("queue")
          .select("*");

        if (fetchError) throw fetchError;

        // NOTE: Fetching all queue data, and then look for current user.
        const userQueueEntry = queueData.find(
          (entry) => entry.red_id === user.id || entry.green_id === user.id,
        );

        if (userQueueEntry) {
          setCurrentQueueEntry(userQueueEntry);
          setIsQueued(true);
          setMatchId(userQueueEntry.match_id);
          // setMatchFound(userQueueEntry.match_found); // duplicate for some reason?
          setRedId(userQueueEntry.red_id);
          setGreenId(userQueueEntry.green_id);
          setQueueCount(userQueueEntry.queue_count);
          setRedReady(userQueueEntry.red_ready);
          setGreenReady(userQueueEntry.green_ready);

          // Match found?
          setMatchFound(!!(userQueueEntry.red_id && userQueueEntry.green_id));

          // If both players are ready, set match status to true
          setMatchStatus(
            userQueueEntry.red_ready && userQueueEntry.green_ready,
          );

          // if (matchFound && redReady || matchFound && greenReady) {
          //   setLoading(true);
          // } else {
          //   setLoading(false);
          // }

          console.log(
            "Debug before enterMatch: ",
            "\n matchFound: ",
            matchFound,
            "\n redReady: ",
            redReady,
            "\n greenReady: ",
            greenReady,
          );
          if (matchFound && redReady && greenReady) {
            await enterMatch(matchId, redId, greenId);
          }

          // Enter match if both players are ready... Queue entry is deleted, so this will not be entered
          // again by mistake.
          // if (userQueueEntry.red_ready && userQueueEntry.green_ready) {
          //   setMatchFound(false);
          //   setIsQueued(false);
          //
          //   // NOTE: I have set setLoading(true) and the beginning of both these functions,
          //   //  because they are not called anywhere else.
          //   // await fetchingMatchEntries();
          //   await enterMatch(
          //     userQueueEntry.match_id,
          //     userQueueEntry.red_id,
          //     userQueueEntry.green_id,
          //   );
        } else {
          // setMatchStatus(false); TODO:
          setIsQueued(false);
          setMatchFound(false);
        }
        console.log("- - - - - - - - - - - - - - - - -");
      } catch (error) {
        console.error("Error fetching queue table...");
      } finally {
        // console.log(
        //   "setLoading, useEffect(1), was: ",
        //   loading,
        //   "will become: (false)",
        // );

        if (
          (user.id === redId && redReady && !matchStatus && matchFound) ||
          (user.id === greenId && greenReady && !matchStatus && matchFound)
        ) {
          //
        } else {
          setLoading(false);
        }
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
            setMatchFound(updateId.match_found);
            setRedId(updateId.red_id);
            setGreenId(updateId.green_id);
            setQueueCount(updateId.queue_count);
            setRedReady(updateId.red_ready);
            setGreenReady(updateId.green_ready);
          }
        },
      )
      .subscribe();

    // debugState("End: useEffect(1)");

    return () => {
      queueChannel.unsubscribe();
    };
  }, [user, isQueued, redReady, greenReady]);

  /* ccc
   *  MATCH
   *  Update user state variables for conditional rendering... */
  useEffect(() => {
    if (!user) return;
    // debugState("Start: useEffect(2)");

    // console.log("\nPING EXPECTED (1/5)\n");

    const fetchingMatchEntries = async () => {
      try {
        const { data: matchData, error: fetchError } = await supabase
          .from("matches")
          .select("*");

        if (fetchError) throw fetchError;

        // NOTE: Fetching all match data, and then look for current user.
        const userMatchData = matchData.find(
          (entry) => entry.red_id === user.id || entry.green_id === user.id,
        );

        if (userMatchData) {
          // console.log("\nPING EXPECTED (2/5)\n");
          setMatchEntry(userMatchData);
          setMatchConcluded(userMatchData.match_concluded);
          setEntryId(userMatchData.id);
          setMatchId(userMatchData.match_id);
          setMatchStatus(userMatchData.match_status);
          setGameStatus(userMatchData.game_status);
          setRedId(userMatchData.red_id);
          setGreenId(userMatchData.green_id);
          setMoveNumber(userMatchData.move_number);
          setMadeMove(userMatchData.made_move);
          setCurrentPlayer(userMatchData.current_player);

          // Parsing the JSON back into a TokenBoard array.
          const fetchedBoard: TokenBoard = JSON.parse(userMatchData.board);
          setBoard(fetchedBoard);
          // console.log("Match data fetched...", userMatchData);
        } else {
          // console.log("\nPING UN-EXPECTED (1/3)\n");
          setMatchStatus(false);
        }
      } catch (error) {
        // console.log("\nPING UN-EXPECTED (2/3)\n");
        setMatchStatus(false); // NOTE: This could be problematic?
        console.error("Error while fetching match entries...", error);
      }
    };

    fetchingMatchEntries().catch((error) =>
      console.error("Error fetching match entries:", error),
    );

    const matchChannel = supabase
      .channel(`matches`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          console.log("Matches changed", payload);
          // console.log("\nPING EXPECTED (3/5)\n");
          fetchingMatchEntries();
          const updateId = payload.new as MatchEntry;
          if (updateId) {
            // console.log("\nPING EXPECTED (4/5)\n");
            setEntryId(updateId.id);
            setMatchConcluded(updateId.match_concluded);
            setMatchId(updateId.match_id);
            setMatchStatus(updateId.match_status);
            setGameStatus(updateId.game_status);
            setRedId(updateId.red_id);
            setGreenId(updateId.green_id);
            setMoveNumber(updateId.move_number);
            setMadeMove(updateId.made_move);
            setCurrentPlayer(updateId.current_player);

            const parseBoard: TokenBoard = JSON.parse(updateId.board);
            if (parseBoard) {
              setBoard(parseBoard);
            }
          } else {
            // console.log("\nPING UN-EXPECTED (3/3)\n");
          }
        },
      )
      .subscribe();

    // console.log("\nPING EXPECTED (5/5)\n");

    return () => {
      matchChannel.unsubscribe();
    };
  }, [user, moveNumber]);

  /* ccc
   *  GAME STATE
   *  Check for a conclusion to the game... */
  useEffect(() => {
    if (!user && moveNumber >= 1) return;
    // debugState("Start: useEffect(3)");

    const gameState = async () => {
      const currentBoardState = checkBoardState(board);
      let newGameStatus: GameStatus | Player;

      if (currentBoardState === "red" || currentBoardState === "green") {
        newGameStatus = currentBoardState;

        // Save changes...
        setGameStatus(newGameStatus);
        await updateGameStatus(newGameStatus);
        return;
      } else if (moveNumber === 42) {
        newGameStatus = "draw";

        // Save changes...
        setGameStatus(newGameStatus);
        await updateGameStatus(newGameStatus);
        return;
      } else {
        newGameStatus = "inProgress";

        // Save changes...
        setGameStatus(newGameStatus);
        await updateGameStatus(newGameStatus);
        return;
      }
    };

    gameState();
  }, [moveNumber]);

  const gameEnded = async () => {
    if (!user || !matchConcluded) return;

    try {
      const { data: matchData, error: fetchError } = await supabase
        .from("matches")
        .select("*")
        .eq("match_id", matchId)
        .single();

      if (fetchError) throw fetchError;

      const matchConclusion: MatchEntry = {
        id: matchData.id,
        created_at: matchData.created_at,
        match_id: matchId,
        match_status: false,
        match_concluded: true,
        game_status: matchData.game_status,
        red_id: matchData.red_id,
        green_id: matchData.green_id,
        move_number: matchData.move_number,
        made_move: matchData.made_move,
        board: matchData.board,
        current_player: matchData.current_player,
      };

      const { error: updateError } = await supabase
        .from("match_history")
        .insert(matchConclusion)
        .eq("match_id", matchId);

      if (updateError) throw updateError;

      setMatchStatus(false);

      // Reset all states
      setMatchId(null);
      setEntryId(undefined);
      setRedId(null);
      setGreenId(null);
      setCurrentQueueEntry([]);
      setQueueCount(null);
      setRedReady(false);
      setGreenReady(false);
      setMatchFound(false);
      setMatchEntry(null);
      setGameStatus("inProgress");
      setMoveNumber(0);
      setMadeMove(null);
      setCurrentPlayer("red");
      setMatchStatus(false);
      setBoard(generateEmptyBoard());
      setIsQueued(false);
      setLoading(false);
    } catch (error) {
      console.error("Error while trying up cleanup and end match.", error);
    }
  };

  useEffect(() => {
    if (matchConcluded) {
      const timeoutId = setTimeout(async () => {
        await gameEnded();
      }, 15000);

      return () => clearTimeout(timeoutId);
    }
  }, [matchConcluded]);

  const debugState = (where: string = "") => {
    if (!user) return;

    // prettier-ignore
    // console.log(
    //                 "Debug info :", where, "\n",
    //                 "\nentryId: ", entryId, " (id of row in db)",
    //                 "\nmatchId: ", matchId,
    //                 "\nredId: ", redId,
    //                 "\ngreenId: ", greenId,
    //                 "\nredReady", redReady,
    //                 "\ngreenReady: ", greenReady,
    //                 "\ncurrentPlayer: ", currentPlayer,
    //                 "\nYouAreRed?: ", user.id === redId,
    //                 "\nYouAreGreen?: ", user.id === greenId,
    //                 "\nmadeMove: ", madeMove,
    //                 "\nmoveNumber: ", moveNumber,
    //                 "\nisQueued: ", isQueued,
    //                 "\nqueueCount", queueCount,
    //                 "\nmatchFound: ", matchFound, " (two players in one 'queue' row)",
    //                 "\nmatchStatus: ", matchStatus, " (two players ready, match started)",
    //                 "\ngameStatus: ", gameStatus, " (state of the game)",
    //                 "\nloading: ", loading,
    //                 "\nboard: ", board,
    //                 "\nmatchEntry: ", matchEntry, " (interface of 'matches' db)",
    //                 "\ncurrentQueueEntry: ", currentQueueEntry, " (interface of 'queue' db)",
    //             );

    console.log("\n\n-- board: ", board, ", ", where);
  };

  /* ccc
   *  A function to create a new entry in the "queue" table... */
  const createEntry = async () => {
    if (!user) return;
    console.log("\n---- CreateEntry() ----\n");

    // NOTE: Not needed since this is called from handleEnterQueue()
    // console.log(
    //   "setLoading, createEntry, was: ",
    //   loading,
    //   "will become: (true)",
    // );
    // setLoading(true);

    try {
      const newMatchId = uuidv4();

      const { error } = await supabase.from("queue").insert([
        {
          match_id: newMatchId,
          red_id: user.id,
          red_status: true,
          green_id: null,
          green_status: null,
          queue_count: "1",
        },
      ]);

      if (error) {
        console.error("Error inserting new entry to 'queue' table: ", error);
        return;
      }

      setIsQueued(true);
    } catch (error) {
      console.error("Error while trying to create entry...", error);
    }

    // NOTE: Not needed since this is called from handleEnterQueue()
    // finally {
    //   console.log(
    //     "setLoading, createEntry, was: ",
    //     loading,
    //     "will become: (false)",
    //   );
    //   setLoading(false);
    // }
  };

  /* ccc
   *  Function to join an existing entry in the "queue" table... */
  const joinEntry = async (matchId: string | null) => {
    if (!user || !matchId) return;
    console.log("\n---- joinEntry() ----\n");

    // NOTE: Not needed since this is called from handleEnterQueue()
    // console.log("setLoading, joinEntry, was: ", loading, "will become: (true)");
    // setLoading(true);

    try {
      const { error } = await supabase
        .from("queue")
        .update([
          {
            green_id: user.id,
            green_status: true,
            queue_count: "2",
          },
        ])
        .eq("match_id", matchId);

      if (error) {
        console.error("Error inserting new entry to 'queue' table: ", error);
      } else {
        setIsQueued(true);
        setMatchFound(true); // Don't use as dependency
      }
    } catch (error) {
      console.error("Error while trying to join queue...", error);
    }

    // NOTE: Not needed since this is called from handleEnterQueue()
    // finally {
    //   console.log(
    //     "setLoading, joinEntry, was: ",
    //     loading,
    //     "will become: (false)",
    //   );
    //   setLoading(false);
    // }
  };

  /* ccc
   *  Function to join the queue */
  const handleEnterQueue = async () => {
    if (!user) return;
    console.log("\n---- handleEnterQueue() ----\n");

    // console.log(
    //   "setLoading, handleEnterQueue, was: ",
    //   loading,
    //   "will become: (true)",
    // );
    setLoading(true);

    try {
      // Fetch all queue entries with value "1" indicating there is an open spot
      const { data: queueEntries, error } = await supabase
        .from("queue")
        .select("*")
        .eq("queue_count", "1");

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
    } catch (error) {
      console.error("Error while trying to join queue: ", error);
    } finally {
      // console.log(
      //   "setLoading, handleEnterQueue, was: ",
      //   loading,
      //   "will become: (false)",
      // );
      setLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!user || !matchId) return; // Immediately return if user is not aware of any matchId...
    console.log("\n---- handleLeaveQueue() ----\n");

    // console.log(
    //   "setLoading, handleLeaveQueue, was: ",
    //   loading,
    //   "will become: (true)",
    // );
    setLoading(true);

    try {
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
            queue_count: playerCount - 1,
          };
        } else if (queueEntry.green_id === user.id) {
          updatePayload = {
            green_id: null,
            green_status: null,
            queue_count: playerCount - 1,
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
    } catch (error) {
      console.error("Error while trying to leave queue...", error);
    } finally {
      // console.log(
      //   "setLoading, handleLeaveQueue, was: ",
      //   loading,
      //   "will become: (false)",
      // );
      setLoading(false);
    }
  };

  /* ccc
   *  Function to mark players are ready... */
  const acceptPlayerReady = async (matchId: string, playerId: string) => {
    if (!matchId || !playerId || !user) return;
    console.log("\n---- acceptPlayerReady() ----\n");

    // console.log(
    //   "setLoading, acceptPlayerReady, was: ",
    //   loading,
    //   "will become: (true)",
    // );
    setLoading(true);

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
          ? { red_ready: true, match_found: true }
          : { green_ready: true, match_found: true };

      const { error: updateError } = await supabase
        .from("queue")
        .update(updatePayload)
        .eq("match_id", matchId);

      if (updateError) throw updateError;

      console.log("Player marked as ready");

      // Save state
      if (playerId === redId) setRedReady(true);
      if (playerId === greenId) setGreenReady(true);
    } catch (error) {
      console.error("Error marking player as ready:", error);
    } finally {
      // setIsQueued(false);
      // setMatchFound(true);
      // console.log(
      //   "setLoading, acceptPlayerReady, was: ",
      //   loading,
      //   "will become: (false)",
      // );
      setLoading(false);
    }
  };

  /* ccc
   *  This function needs to:
   *  1. End the queue by deleting the entry
   *  2. Notify the other user that the match was declined */
  const declinePlayerReady = async (matchId: string, playerId: string) => {
    if (!matchId || !playerId) return;
    console.log("\n---- declinePlayerReady() ----\n");

    // console.log(
    //   "setLoading, declinePlayerReady, was: ",
    //   loading,
    //   "will become: (true)",
    // );
    setLoading(true);

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
      // setMatchStatus(false); // This is not needed, as the match status will not be true before both players are ready
      setIsQueued(false);
      setMatchFound(false);
    } catch (error) {
      console.error("Error while attempting to delete queue entry", error);
    } finally {
      // console.log(
      //   "setLoading, declinePlayerReady, was: ",
      //   loading,
      //   "will become: (false)",
      // );
      setLoading(false);
    }
  };

  /* ccc
   *  This function will enter match, meaning it will create an entry in "matches" table,
   *  then it will delete the previous record in the "queue" table, if successful. */
  const enterMatch = async (
    matchId: string | null,
    redId: string | null,
    greenId: string | null,
  ) => {
    console.log("\n---- enterMatch() ----\n");

    // console.log(
    //   "Debug after enterMatch: ",
    //   "\nuser: ",
    //   user,
    //   "\n redId: ",
    //   redId,
    //   "\ngreenId: ",
    //   greenId,
    //   "\nmatchId: ",
    //   matchId,
    // );
    if (!user || !redId || !greenId || !matchId) return;
    // console.log(
    //   "setLoading, enterMatch, was: ",
    //   loading,
    //   "will become: (true)",
    // );
    setLoading(true);
    console.log("From enterMatch, matchStatus: ", matchStatus);

    try {
      // Converting to JSON format before inserting, this way we can maintain the array format we need
      // when we retrieve the record later by parsing it.
      const jsonBoard = JSON.stringify(board);

      const matchEntry: MatchEntry = {
        id: entryId,
        match_id: matchId,
        created_at: new Date().toISOString(),
        match_status: true,
        match_concluded: false,
        game_status: "inProgress", // Initial "inProgress"... others "draw", "red", "green"...
        red_id: redId,
        green_id: greenId,
        move_number: 0,
        made_move: null,
        board: jsonBoard,
        current_player: "red",
      };

      // Only one user needs to do the insert and deletion actions, this will prevent unnecessary errors.
      if (user.id === redId) {
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
          setCurrentQueueEntry([]); // Purge the QueueEntry after deletions so data doesn't hang around...
          console.log("Queue entry successfully deleted...");
        }
      }

      // setMatchFound(false);
      setMatchEntry(matchEntry);
    } catch (error) {
      console.error("Error while trying to enter match...", error);
    } finally {
      // console.log(
      //   "setLoading, enterMatch, was: ",
      //   loading,
      //   "will become: (false)",
      // );
      setLoading(false);
    }
  };

  /* ccc
   *  Handling match state variables when players click the columns... */
  const handleColumnClick = async (colIndex: number) => {
    // debugState("-- handleColumnClick() --");
    if (!user || !matchId || gameStatus !== "inProgress") return;

    // Stop player from moving out of turn...
    if (
      (currentPlayer === "red" && user.id !== redId) ||
      (currentPlayer === "green" && user.id !== greenId)
    ) {
      console.log("Wait for opponent to make a move...");
      return;
    }

    const newBoard = [...board];
    let tokenPlaced: boolean = false;
    for (let i = 0; i <= newBoard[colIndex].length - 1; i++) {
      if (newBoard[colIndex][i] === null) {
        newBoard[colIndex][i] = currentPlayer; // Board updated with current players token
        tokenPlaced = true;
        break;
      }
    }

    if (!tokenPlaced) {
      return; // Column must be full...
    }

    const newTurn = currentPlayer === "red" ? "green" : "red";
    const newMoveNumber = moveNumber + 1;

    setBoard(newBoard);
    setCurrentPlayer(newTurn);
    setMoveNumber(newMoveNumber);

    await updateGame(newBoard, newTurn, newMoveNumber);
  };

  const updateGame = async (
    newBoard: TokenBoard,
    newTurn: Player,
    newMoveNumber: number,
  ) => {
    console.log("\n---- updateGame() ----\n");

    const jsonBoard = JSON.stringify(newBoard);

    try {
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          board: jsonBoard,
          move_number: newMoveNumber,
          current_player: newTurn,
          made_move: newTurn,
        })
        .eq("match_id", matchId);

      if (updateError) throw updateError;

      console.log("Successfully updated matches table...");
    } catch (error) {
      console.error("Error updating 'matches' table: ", error);
    }
  };

  const updateGameStatus = async (newGameStatus: GameStatus | Player) => {
    if (!user) return;
    console.log("\n---- updateGameStatus() ----\n");
    let newMatchConclusion: boolean = false;

    // See if the match is completed or no
    if (
      newGameStatus === "red" ||
      newGameStatus === "green" ||
      newGameStatus === "draw"
    ) {
      newMatchConclusion = true;
    }

    try {
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          game_status: newGameStatus,
          match_concluded: newMatchConclusion,
        })
        .eq("match_id", matchId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating 'matches' table: ", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      {loading ? (
        <div className="lds-dual-ring"></div>
      ) : (
        <div className="transform -translate-y-44">
          {/*<h2>Queue Status</h2>*/}
          {!isQueued && !matchStatus && (
            <Button onClick={handleEnterQueue} className="m-4">
              Join Queue
            </Button>
          )}

          {isQueued && !matchFound && (
            <p className="m-4">
              You are currently in the queue. Please wait for your match to
              start.
            </p>
          )}

          {user && user.id === redId && redReady && (
            <div className="lds-dual-ring"></div>
          )}

          {user &&
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

          {matchStatus && <p>You are currently in a match.</p>}

          {/* Conditionally render a leave queue button if the user is in the queue but not yet in a match */}
          {isQueued && !matchFound && (
            <Button onClick={handleLeaveQueue} className="m-4">
              Leave Queue
            </Button>
          )}

          {/* MATCH PLAY AREA*/}
          {matchStatus && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "85vh",
              }}
              className="transform translate-y-32"
            >
              {/* Clickable columns */}
              <div style={{ display: "flex" }}>
                {board.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    style={{
                      display: "flex",
                      flexDirection: "column-reverse",
                      margin: "5px",
                    }}
                  >
                    {column.map((cell, rowIndex) => (
                      <div
                        key={rowIndex}
                        onClick={() => handleColumnClick(columnIndex)}
                        style={{
                          width: "50px",
                          height: "50px",
                          border: "1px solid black",
                          backgroundColor: cell || "white",
                        }}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "20px" }}>
                <ul className="flex-auto items-center">
                  <li style={{ marginTop: "0px" }}>
                    {gameStatus !== "inProgress" && matchId && (
                      <Alert>
                        Game Over:{" "}
                        {gameStatus === "draw"
                          ? "Draw"
                          : `Winner is ${gameStatus}`}
                      </Alert>
                    )}
                  </li>
                  <li>{matchId && <p>Move Number: {moveNumber}</p>}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Give the player the option of entering queue immediately */}
          {matchStatus && matchConcluded && (
            <Button
              onClick={() => {
                gameEnded().then(handleEnterQueue); // Ensure gameEnded completes before re-queueing
              }}
              className="m-4  transform translate-y-12"
            >
              Re-queue
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Multiplayer;
