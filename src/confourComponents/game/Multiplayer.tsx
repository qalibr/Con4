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
  const [board, setBoard] = useState<TokenBoard | null>(generateEmptyBoard());

  /* ccc - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  Useful state variables to control the flow of the app... */
  // Denotes if a player is queued or not
  const [isQueued, setIsQueued] = useState<boolean>(false);

  // Improve user experience with loading spinner
  const [loading, setLoading] = useState<boolean>(false);

  // Countdown variable to notify users of when they would be thrown out of a match.
  const [countdown, setCountdown] = useState<number>(0);

  /* ccc - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  QUEUE
   *  Update user state variables for conditional rendering... */
  useEffect(() => {
    if (!user) return;

    // if match status is true, set queue and match found to false, and don't try to fetch queue table
    if (matchStatus) {
      setIsQueued(false);
      setMatchFound(false);
      setLoading(false);
      return;
    } else {
      setLoading(true); // So we don't keep loading during the actual game...
    }

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

          if (matchFound && redReady && greenReady) {
            await enterMatch(matchId, redId, greenId);
          }
        } else {
          setIsQueued(false);
          setMatchFound(false);
        }
      } catch (error) {
        console.error("Error fetching queue table...");
      } finally {
        if (
          (user.id === redId && redReady && !matchStatus && matchFound) ||
          (user.id === greenId && greenReady && !matchStatus && matchFound)
        ) {
          // Already true
        } else {
          setLoading(false);
        }
      }
    };

    fetchingEntries().catch(console.error);

    // Broadcast changes to state to other players.
    const queueChannel = supabase
      .channel(`queue`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        (payload) => {
          fetchingEntries().catch(console.error); // First fetch any new potential changes.
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

    return () => {
      queueChannel.unsubscribe();
    };

    // These dependencies are needed to trigger this useEffect so that it properly maintains the queue
    // state.
  }, [user, isQueued, redReady, greenReady, matchId]);

  /* ccc
   *  MATCH
   *  Update user state variables for conditional rendering... */
  useEffect(() => {
    if (!user) return;

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
        } else {
          setMatchStatus(false); // Match is not true if current user has no match entry
        }
      } catch (error) {
        setMatchStatus(false); // NOTE: This could be problematic?
        console.error("Error while fetching match entries...", error);
      }
    };

    fetchingMatchEntries().catch(console.error);

    const matchChannel = supabase
      .channel(`matches`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          fetchingMatchEntries().catch(console.error);
          const updateId = payload.new as MatchEntry;
          try {
            if (updateId) {
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

              // Parse the board and broadcast changes so the other player knows about them.
              const parseBoard: TokenBoard = JSON.parse(updateId.board);

              if (parseBoard) {
                setBoard(parseBoard);
              }
            }
          } catch (error) {
            // If the other player does a re-queue upon a concluded match, this will automatically
            // trigger a cleanup for the current user as well.
            console.error(
              "Error, updateId is null or undefined",
              updateId,
              "\n ending game...",
            );
            gameEnded().catch(console.error);
          }
        },
      )
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
    };

    // These are the dependencies needed to make sure this useEffect is triggered at the right times.
  }, [user, moveNumber, matchStatus, gameStatus, matchId]);

  /* ccc
   *  GAME STATE
   *  Check for a conclusion to the game... */
  useEffect(() => {
    if (!user && moveNumber >= 1) return;

    const gameState = async () => {
      if (!board) return;
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

    // Simply trigger on moveNumber, nothing more is needed.
  }, [moveNumber]);

  /* ccc
   *  This function aims to delete the match entry, save the data to match_history and the reset state variables. */
  const gameEnded = async () => {
    if (
      !user ||
      !matchConcluded ||
      moveNumber === 0 ||
      moveNumber === undefined
    )
      return;

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

      const { error: deleteError } = await supabase
        .from("matches")
        .delete()
        .match({ match_id: matchId });

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from("match_history")
        .insert(matchConclusion)
        .eq("match_id", matchId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Other player already cleaned up here.");
    } finally {
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
      setBoard(generateEmptyBoard); // Flush board
      setIsQueued(false);
      setLoading(false);
    }
  };

  /* ccc
   *  Timeout the match upon conclusion and return players to start */
  useEffect(() => {
    if (!user) return;

    if (matchConcluded) {
      let intervalId: string | number | NodeJS.Timeout | undefined;
      const postMatchTimer = 15;
      setCountdown(postMatchTimer);

      // eslint-disable-next-line prefer-const
      intervalId = setInterval(() => {
        setCountdown((currentCountdown) => {
          if (currentCountdown <= 1) {
            gameEnded().catch(console.error);
            clearInterval(intervalId);
            return 0;
          }

          return currentCountdown - 1;
        });
      }, 1000);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [matchConcluded]);

  /* ccc
   *  Timeout if a both users don't accept within a certain threshold */
  useEffect(() => {
    if (!user || !matchId) return;

    let intervalId: string | number | NodeJS.Timeout | undefined;
    const acceptanceTime: number = 15;
    setCountdown(acceptanceTime);

    let queueTimeout: boolean;
    if (matchFound && user.id === redId && !redReady) {
      queueTimeout = true;
    } else if (matchFound && user.id === greenId && !greenReady) {
      queueTimeout = true;
    } else if (matchFound && (!redReady || !greenReady)) {
      queueTimeout = true;
    } else {
      queueTimeout = false;
    }

    if (queueTimeout) {
      intervalId = setInterval(() => {
        setCountdown((currentCountdown) => {
          if (currentCountdown <= 1) {
            declinePlayerReady(matchId, user.id).catch(console.error);
            clearInterval(intervalId);
            return 0;
          }

          return currentCountdown - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [matchFound, redReady, greenReady]);

  /* ccc
   *  A function to create a new entry in the "queue" table... */
  const createEntry = async () => {
    if (!user) return;

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
  };

  /* ccc
   *  Function to join an existing entry in the "queue" table... */
  const joinEntry = async (matchId: string | null) => {
    if (!user || !matchId) return;

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
  };

  /* ccc
   *  Function to join the queue */
  const handleEnterQueue = async () => {
    if (!user) return;
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
      } else {
        // If no open entry exists, create a new one...
        await createEntry();
      }
    } catch (error) {
      console.error("Error while trying to join queue: ", error);
    } finally {
      setLoading(false);
      setMatchConcluded(false); // TODO: Redundant? This was placed here during troubleshooting.
      setMatchStatus(false); // TODO: Redundant? This was placed here during troubleshooting.
    }
  };

  const handleLeaveQueue = async () => {
    if (!user || !matchId) return; // Immediately return if user is not aware of any matchId...

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
      }

      setIsQueued(false);
      setMatchFound(false);
    } catch (error) {
      console.error("Error while trying to leave queue...", error);
    } finally {
      setLoading(false);
    }
  };

  /* ccc
   *  Function to mark players are ready... */
  const acceptPlayerReady = async (matchId: string, playerId: string) => {
    if (!matchId || !playerId || !user) return;

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

      // Save state
      if (playerId === redId) setRedReady(true);
      if (playerId === greenId) setGreenReady(true);
    } catch (error) {
      console.error("Error marking player as ready:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ccc
   *  This function needs to:
   *  1. End the queue by deleting the entry
   *  2. Notify the other user that the match was declined */
  const declinePlayerReady = async (matchId: string, playerId: string) => {
    if (!matchId || !playerId) return;

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

      setIsQueued(false);
      setMatchFound(false);
    } catch (error) {
      console.error("Error while attempting to delete queue entry", error);
    } finally {
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
    if (!user || !redId || !greenId || !matchId) return;
    setLoading(true);

    try {
      // Converting to JSON format before inserting, this way we can maintain the array format we need
      // when we retrieve the record later by parsing it.
      const newBoard = generateEmptyBoard();
      setBoard(newBoard);
      const jsonBoard = JSON.stringify(newBoard);

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
        }
      }

      setMatchEntry(matchEntry);
      setMatchStatus(true);
      setMoveNumber(0);
    } catch (error) {
      console.error("Error while trying to enter match...", error);
    } finally {
      setLoading(false);
    }
  };

  /* ccc
   *  Handling match state variables when players click the columns... */
  const handleColumnClick = async (colIndex: number) => {
    if (!user || !matchId || gameStatus !== "inProgress" || !board) return;

    // Stop player from moving out of turn...
    if (
      (currentPlayer === "red" && user.id !== redId) ||
      (currentPlayer === "green" && user.id !== greenId)
    ) {
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
    } catch (error) {
      console.error("Error updating 'matches' table: ", error);
    }
  };

  const updateGameStatus = async (newGameStatus: GameStatus | Player) => {
    if (!user) return;
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

      if (newMatchConclusion) {
        setMatchConcluded(newMatchConclusion);
        setGameStatus(newGameStatus);
      }
    } catch (error) {
      console.error("Error updating 'matches' table: ", error);
    }
  };

  /* ccc
   *  Debug function to check state variables */
  const debugState = (where: string = "") => {
    if (!user) return;

    // prettier-ignore
    console.log(
                    "Debug info :", where, "\n",
                    // "\nentryId: ", entryId, " (id of row in db)",
                    "\nmatchId: ", matchId,
                    // "\nredId: ", redId,
                    // "\ngreenId: ", greenId,
                    "\nredReady", redReady,
                    "\ngreenReady: ", greenReady,
                    "\ncurrentPlayer: ", currentPlayer,
                    // "\nYouAreRed?: ", user.id === redId,
                    // "\nYouAreGreen?: ", user.id === greenId,
                    // "\nmadeMove: ", madeMove,
                    "\nmoveNumber: ", moveNumber,
                    "\nisQueued: ", isQueued,
                    "\nqueueCount", queueCount,
                    "\nmatchFound: ", matchFound, " (two players in one 'queue' row)",
                    "\nmatchStatus: ", matchStatus, " (two players ready, match started)",
                    "\ngameStatus: ", gameStatus, " (state of the game)",
                    // "\nloading: ", loading,
                    "\nboard: ", board,
                    "\nmatchEntry: ", matchEntry, " (interface of 'matches' db)",
                    "\ncurrentQueueEntry: ", currentQueueEntry, " (interface of 'queue' db)",
                    "\nmatchConcluded: ", matchConcluded,
                );

    // console.log("\n\n-- board: ", board, ", ", where);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Make sure the board is always visible on the page and is in a static position */}
      <div className="w-full max-w-md mb-4">
        {/* Non-interactive columns as placeholders */}
        {!matchStatus && board && (
          <div className="flex justify-center">
            {board.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col-reverse m-1">
                {column.map((cell, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="w-12 h-12 border border-black bg-white"
                    style={{ backgroundColor: cell || "white" }}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Interactive columns for active match */}
        {matchStatus && board && (
          <div className="flex justify-center">
            {board.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col-reverse m-1">
                {column.map((cell, rowIndex) => (
                  <div
                    key={rowIndex}
                    onClick={() => handleColumnClick(columnIndex)}
                    className="w-12 h-12 border border-black cursor-pointer"
                    style={{ backgroundColor: cell || "white" }}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ccc - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - */}
      {/* Dynamic elements, queue logic, loading spinner, etc. */}
      <div className="w-full max-w-md h-32 flex flex-col items-center justify-center space-y-2">
        {loading ? (
          <div className="lds-dual-ring mb-2"></div>
        ) : (
          <div>
            {/* Spinner while waiting for other player to accept */}
            {user && user.id === redId && redReady && matchFound && (
              <div className="lds-dual-ring mb-2"></div>
            )}

            {/*Queue up*/}
            {!isQueued && !matchStatus && (
              <Button onClick={handleEnterQueue} className="mb-2">
                Join Queue
              </Button>
            )}

            {/*{isQueued && !matchFound && (*/}
            {/*  <p className="mb-2">*/}
            {/*    You are currently in the queue. Please wait for your match to*/}
            {/*    start.*/}
            {/*  </p>*/}
            {/*)}*/}

            {/* Accept/Decline */}
            {user && matchFound && (!redReady || !greenReady) && (
              <div className="flex flex-col items-center mb-2">
                <p>Found match! {countdown}</p>
                <Button
                  onClick={() =>
                    matchId && user && acceptPlayerReady(matchId, user.id)
                  }
                  className="mb-1"
                >
                  Accept
                </Button>
                <Button
                  onClick={() =>
                    matchId && user && declinePlayerReady(matchId, user.id)
                  }
                >
                  Decline
                </Button>
              </div>
            )}

            {matchStatus && (
              <p className="mb-2">You are currently in a match.</p>
            )}

            {isQueued && !matchFound && (
              <Button onClick={handleLeaveQueue} className="mb-2">
                Leave Queue
              </Button>
            )}

            {matchStatus && matchConcluded && (
              <Button
                onClick={() => gameEnded().then(handleEnterQueue)}
                className="mt-2"
              >
                Re-queue
              </Button>
            )}

            <div>
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
                <li>
                  {matchId && matchStatus && <p>Move Number: {moveNumber}</p>}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Multiplayer;
