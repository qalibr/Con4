import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import "animate.css";
import useAuth from "@/confourHooks/useAuth.tsx";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button.tsx";

import {
  TokenBoard,
  QueueCount,
  GameStatus,
  Player,
} from "@/confourComponents/game/types.tsx";
import {
  checkBoardState,
  generateEmptyBoard,
} from "@/confourComponents/game/game-logic.tsx";
import { Alert } from "@/components/ui/alert.tsx";
import { QueueEntry } from "@/confourComponents/game/queueEntry.tsx";
import { MatchEntry } from "@/confourComponents/game/matchEntry.tsx";
import { LastModifiedCell } from "@/confourComponents/game/lastModifiedCell.tsx";
import { MatchHistory } from "@/confourComponents/game/matchHistory.tsx"; // TODO: Not yet implemented

const MultiplayerScreen = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string>(""); // To give feedback to the user on what is wrong
  const [loading, setLoading] = useState<boolean>(false); // Improve user experience with loading spinner
  const [boardScale, setBoardScale] = useState<number>(1);

  /*
   * Basic id's */
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

  // Countdown variable to notify users of when they would be thrown out of a match.
  const [countdown, setCountdown] = useState<number>(0);
  const moveTimeLimit = 500;
  const [moveTimer, setMoveTimer] = useState<number>(moveTimeLimit);
  const [lastModifiedCell, setLastModifiedCell] = useState<LastModifiedCell>({
    columnNumber: null,
    rowNumber: null,
  });

  const defaultUsernameRed: string = "Player_Red";
  const defaultUsernameGreen: string = "Player_Green";

  const [usernameRed, setUsernameRed] = useState<string | undefined>(
    defaultUsernameRed,
  );
  const [usernameGreen, setUsernameGreen] = useState<string | undefined>(
    defaultUsernameGreen,
  );

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
     * Fetching the entire "queue" table... */
    const fetchingEntries = async () => {
      try {
        const { data: queueData, error: fetchError } = await supabase
          .from("queue")
          .select("*");

        if (fetchError) throw fetchError;

        // Fetching all queue data, and then look for current user.
        const userQueueEntry = queueData.find(
          (entry) => entry.red_id === user.id || entry.green_id === user.id,
        );

        if (userQueueEntry) {
          setCurrentQueueEntry(userQueueEntry);
          setIsQueued(true); // Setting manually for smoother state handling
          setMatchId(userQueueEntry.match_id);
          setRedId(userQueueEntry.red_id);
          setGreenId(userQueueEntry.green_id);
          setQueueCount(userQueueEntry.queue_count);
          setRedReady(userQueueEntry.red_ready);
          setGreenReady(userQueueEntry.green_ready);

          // Was match found?
          setMatchFound(!!(userQueueEntry.red_id && userQueueEntry.green_id));

          // If both players are ready, set match status to true
          setMatchStatus(
            userQueueEntry.red_ready && userQueueEntry.green_ready,
          );

          if (matchFound && redReady && greenReady) {
            await enterMatch(matchId, redId, greenId);
          }
        } else {
          // If queue entry was not successfully retrieved, reset state
          setIsQueued(false);
          setMatchFound(false);
        }
      } catch (error) {
        console.error("Error fetching queue table...");
        setError("Error occurred while fetching queue table.");
      } finally {
        if (
          (user.id === redId && redReady && !matchStatus && matchFound) ||
          (user.id === greenId && greenReady && !matchStatus && matchFound)
        ) {
          // Loading is already true here.
        } else {
          setLoading(false);
        }
      }
    };

    fetchingEntries().catch(console.error);

    // Detect changed state to other players.
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
      queueChannel.unsubscribe().catch(console.error);
    };

    /*
     * This effect needs to be triggered when changes to these variables occur. */
    // eslint-disable-next-line
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

        // Fetching all match data, and then look for current user.
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
          setUsernameRed(userMatchData.red_username);
          setUsernameGreen(userMatchData.green_username);

          // Parsing the JSON back into a "TokenBoard" array.
          const fetchedBoard: TokenBoard = JSON.parse(userMatchData.board);
          setBoard(fetchedBoard);
        } else {
          setMatchStatus(false); // Match is not true if current user has no match entry
        }

        // TODO: Fetching username and match history
      } catch (error) {
        setMatchStatus(false); // NOTE: This could be problematic?
        console.error("Error while fetching match entries...", error);
        setError("Error while fetching match entries...");
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
              setUsernameRed(updateId.red_username);
              setUsernameGreen(updateId.green_username);

              // Parse the board and detect changes so the other player knows about them.
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
      matchChannel.unsubscribe().catch(console.error);
    };

    // eslint-disable-next-line
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

    gameState().catch(console.error);

    // eslint-disable-next-line
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
        game_status: matchData.game_status,
        red_id: matchData.red_id,
        green_id: matchData.green_id,
        move_number: matchData.move_number,
        current_player: matchData.current_player,
        board: matchData.board,
        match_concluded: true,
        made_move: matchData.made_move,
        red_username: "Ruby", // Not saving the username in match history
        green_username: "Emerald", // Not saving the username in match history
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
      setUsernameRed(defaultUsernameRed);
      setUsernameGreen(defaultUsernameGreen);

      setLastModifiedCell({ columnNumber: null, rowNumber: null });
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

    // eslint-disable-next-line
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
    } else queueTimeout = matchFound && (!redReady || !greenReady);

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

    // eslint-disable-next-line
  }, [matchFound, redReady, greenReady]);

  /* ccc
   *  This effect will timeout a player if they don't move within the required time, and they will forfeit. */
  useEffect(() => {
    if (!user) return;

    let timerId: string | number | NodeJS.Timeout | undefined;

    if (
      currentPlayer === (user.id === redId ? "red" : "green") &&
      matchStatus
    ) {
      timerId = setInterval(() => {
        setMoveTimer((prevTimer) => {
          if (prevTimer === 1) {
            // Time's up, current player failed to make a move
            const winningPlayer = currentPlayer === "red" ? "green" : "red";
            updateGameStatus(winningPlayer).catch(console.error);
            clearInterval(timerId);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000); // Decrease timer every second
    }

    return () => {
      clearInterval(timerId);
      setMoveTimer(moveTimeLimit); // Reset timer when the effect cleans up
    };

    // eslint-disable-next-line
  }, [currentPlayer, matchStatus]);

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
    match_id: string | null,
    red_id: string | null,
    green_id: string | null,
  ) => {
    if (!user || !red_id || !green_id || !match_id) return;
    setLoading(true);

    try {
      // Converting to JSON format before inserting, this way we can maintain the array format we need
      // when we retrieve the record later by parsing it.
      const newBoard = generateEmptyBoard();
      setBoard(newBoard);
      const jsonBoard = JSON.stringify(newBoard);

      // Pulling usernames
      const { data: usersData, error: fetchUsersError } = await supabase
        .from("users")
        .select("user_id, username");

      // Assigning default usernames
      let fetched_red_username;
      let fetched_green_username;

      if (fetchUsersError) {
        console.error(
          "Something went wrong when fetching users.",
          fetchUsersError,
        );
      } else if (usersData) {
        // If data was retrieved assign them again.
        fetched_red_username =
          usersData.find((entry) => entry.user_id === red_id)?.username ||
          defaultUsernameRed;
        fetched_green_username =
          usersData.find((entry) => entry.user_id === green_id)?.username ||
          defaultUsernameGreen;
      }

      // Creating match entry to insert to "matches" table
      const matchEntry: MatchEntry = {
        id: undefined, // Let supabase assign ID
        match_id: match_id,
        created_at: undefined, // Let supabase assign date
        match_status: true, // True means to render a clickable board. False, a static board.
        match_concluded: false,
        game_status: "inProgress", // "inProgress", "draw", "red", "green"
        red_id: red_id,
        green_id: green_id,
        move_number: 0,
        made_move: null,
        board: jsonBoard,
        current_player: "red", // Red goes first
        red_username: fetched_red_username,
        green_username: fetched_green_username,
      };

      // Only one user needs to do the insert and deletion actions, this will prevent unnecessary errors.
      if (user.id === red_id) {
        // Insert new entry to "matches" table...
        const { error: insertError } = await supabase
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

        // Delete the queue entry
        const { error: deleteError } = await supabase
          .from("queue")
          .delete()
          .match({ match_id: match_id });

        if (deleteError) {
          console.error("Error deleting queue entry: ", deleteError);
          return;
        } else {
          setCurrentQueueEntry([]); // Purge the QueueEntry after deletions so data doesn't hang around...
        }

        const { error: fetchMatchHistoryError } = await supabase
          .from("match_history")
          .select("red_id, green_id, game_status");

        if (fetchMatchHistoryError) {
          console.error(
            "Something went wrong when fetching users.",
            fetchMatchHistoryError,
          );
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
  // eslint-disable-next-line
  const handleColumnClick = async (colIndex: number, event: any) => {
    if (!user || !matchId || gameStatus !== "inProgress" || !board) {
      event.stopPropagation();
      console.log("Child");
      return;
    }

    // Stop player from moving out of turn...
    if (
      (currentPlayer === "red" && user.id !== redId) ||
      (currentPlayer === "green" && user.id !== greenId)
    ) {
      return;
    }

    const newBoard = [...board];
    let tokenPlaced: boolean = false;
    let placedRow = null;

    for (
      let rowIndex = 0;
      rowIndex <= newBoard[colIndex].length - 1;
      rowIndex++
    ) {
      if (newBoard[colIndex][rowIndex] === null) {
        newBoard[colIndex][rowIndex] = currentPlayer; // Board updated with current players token
        tokenPlaced = true;
        placedRow = rowIndex;
        break;
      }
    }

    if (!tokenPlaced) {
      event.stopPropagation();
      return; // Column must be full...
    }

    if (placedRow !== null) {
      setLastModifiedCell({ columnNumber: colIndex, rowNumber: placedRow });
    }

    const newTurn = currentPlayer === "red" ? "green" : "red";
    const newMoveNumber = moveNumber + 1;

    setBoard(newBoard);
    setMoveTimer(moveTimeLimit);
    setCurrentPlayer(newTurn);
    setMoveNumber(newMoveNumber);

    await updateGame(newBoard, newTurn, newMoveNumber);
    event.stopPropagation();
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

  /*
   * Dynamic rescaling for problematic small screen dimensions */
  const handleAdjustBoardScale = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth < 600 && 450 < screenWidth) {
      setBoardScale(0.9);
    } else if (screenWidth <= 450) {
      setBoardScale(0.75);
    } else {
      setBoardScale(1);
    }
  };

  useEffect(() => {
    handleAdjustBoardScale();
    window.addEventListener("resize", handleAdjustBoardScale);

    return () => {
      window.removeEventListener("resize", handleAdjustBoardScale);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Make sure the board is always visible on the page and is in a static position */}
      <div className="w-full max-w-md mb-2 " style={{ transform: `scale(${boardScale})` }}>
        {/* Non-interactive columns as placeholders */}
        {!matchStatus && board && (
          <div>
            {user && (
              <div className="c4-players-bar">
                <div className="flex justify-items-start">
                  {`${user.id === redId ? usernameRed : usernameGreen}: `}
                </div>

                <div className="flex justify-items-start">
                  {`${user.id !== redId ? usernameRed : usernameGreen}: `}
                </div>
              </div>
            )}
            <div className="c4-board flex justify-center">
              {board.map((column, columnIndex) => (
                <div key={columnIndex} className={`c4-column-container`}>
                  {column.map((cell, rowIndex) => (
                    <div
                      key={rowIndex}
                      className={`c4-cell c4-cell-${cell || "empty"} ${
                        lastModifiedCell.columnNumber === columnIndex &&
                        lastModifiedCell.rowNumber === rowIndex
                          ? "c4-coin-drop-animation"
                          : ""
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive columns for active match */}
        {matchStatus && board && (
          <div>
            {user && (
              <div className="c4-players-bar">
                <div className="flex justify-items-start">
                  {`${user.id === redId ? usernameRed : usernameGreen}: `}
                </div>

                <div className="flex justify-items-start">
                  {`${user.id !== redId ? usernameRed : usernameGreen}: `}
                </div>
              </div>
            )}
            <div className="c4-board flex justify-center">
              {board.map((column, columnIndex) => (
                <div
                  key={columnIndex}
                  className={`c4-column-container`}
                  onClick={() => {
                    console.log("L");
                  }}
                >
                  {column.map((cell, rowIndex) => (
                    <div
                      key={rowIndex}
                      onClick={(e) => handleColumnClick(columnIndex, e)}
                      className={`c4-cell c4-cell-${cell || "empty"} ${
                        lastModifiedCell.columnNumber === columnIndex &&
                        lastModifiedCell.rowNumber === rowIndex
                          ? "c4-coin-drop-animation"
                          : ""
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ccc - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - _ - */}
      {/* Dynamic elements, queue logic, loading spinner, etc. */}
      <div className="w-full max-w-md h-32 flex flex-col items-center justify-center space-y-2">
        {loading ? (
          <div className="lds-dual-ring -translate-y-5 scale-50"></div>
        ) : (
          <div>
            {user && matchStatus && !matchConcluded && (
              <div
                className={`c4-turn-indicator ${currentPlayer === (user.id === redId ? "red" : "green") ? "c4-your-turn" : "c4-waiting-turn"}`}
              >
                {currentPlayer === (user.id === redId ? "red" : "green")
                  ? `Your turn: ${moveTimer}s`
                  : "Waiting for opponent..."}
              </div>
            )}

            {/* Spinner while waiting for other player to accept */}
            {user && user.id === redId && redReady && matchFound && (
              <div className="lds-dual-ring -translate-y-5 scale-50"></div>
            )}

            {/* Enter Queue */}
            {!isQueued && !matchStatus && (
              <Button
                onClick={handleEnterQueue}
                className="mb-2"
                variant="default"
              >
                Join Queue
              </Button>
            )}
            {/* Leave Queue */}
            {isQueued && !matchFound && (
              <Button
                onClick={handleLeaveQueue}
                className="mb-2"
                variant="destructive"
              >
                Leave Queue
              </Button>
            )}

            {/* Accept/Decline */}
            {user && matchFound && (!redReady || !greenReady) && (
              <div className="flex flex-col items-center mb-2">
                <p>Found match! {countdown}</p>
                <Button
                  onClick={() =>
                    matchId && user && acceptPlayerReady(matchId, user.id)
                  }
                  className="mb-1"
                  variant="secondary"
                >
                  Accept
                </Button>
                <Button
                  onClick={() =>
                    matchId && user && declinePlayerReady(matchId, user.id)
                  }
                  variant="destructive"
                >
                  Decline
                </Button>
              </div>
            )}

            {matchStatus && matchConcluded && (
              <Button
                onClick={() => gameEnded().then(handleEnterQueue)}
                className="mt-2"
              >
                Re-queue
              </Button>
            )}

            <div className="c4-game-over-notice">
              {gameStatus !== "inProgress" && matchId && (
                <Alert>
                  Game Over:{" "}
                  {gameStatus === "draw" ? "Draw" : `Winner is ${gameStatus}`}
                  {" ... "} Exit: {countdown}
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerScreen;
