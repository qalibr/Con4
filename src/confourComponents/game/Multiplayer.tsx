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
  const [matchId, setMatchId] = useState<string | null>(null);
  const [redId, setRedId] = useState<string | null>(null);
  const [greenId, setGreenId] = useState<string | null>(null);

  /* ccc
   *  These state variables are related to the "queue" table... */
  const [currentQueueEntry, setCurrentQueueEntry] = useState<QueueEntry[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(null);
  const [redReady, setRedReady] = useState<boolean>(false);
  const [greenReady, setGreenReady] = useState<boolean>(false);

  /* ccc
   *  Related to "matches" table... */
  const [matchEntry, setMatchEntry] = useState<MatchEntry | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | Player>(null);
  const [moveNumber, setMoveNumber] = useState<number>(0);
  const [madeMove, setMadeMove] = useState<Player>(undefined);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(undefined);
  const [matchStatus, setMatchStatus] = useState<boolean>(false);
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());

  /* ccc
   *  Useful state variables to control the flow of the app... */
  const [isQueued, setIsQueued] = useState<boolean>(false);
  const [matchFound, setMatchFound] = useState<boolean>(false);
  const [declineMatch, setDeclineMatch] = useState<boolean>(false);

  /* ccc
   *  QUEUE
   *  Update user state variables for conditional rendering... */
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
          console.log("Match data fetched...", userMatchData);
        } else {
          setMatchStatus(false);
        }
      } catch (error) {
        setMatchStatus(false);
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
            setMatchStatus(updateId.match_status);
            setMatchId(updateId.match_id);
            setGameStatus(updateId.game_status);
            setRedId(updateId.red_id);
            setGreenId(updateId.green_id);
            setMoveNumber(updateId.move_number);
            setMadeMove(updateId.made_move);
            setCurrentPlayer(updateId.current_player);

            const updateBoard: TokenBoard = JSON.parse(updateId.board);
            setBoard(updateBoard);
          }
        },
      )
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
    };
  }, [user]);

  /* ccc
   *  A function to create a new entry in the "queue" table... */
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

  /* ccc
   *  Function to join an existing entry in the "queue" table... */
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

  /* ccc
   *  Function to join the queue */
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

  /* ccc
   *  Function to mark players are ready... */
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

  /* ccc
   *  This function needs to:
   *  1. End the queue by deleting the entry
   *  2. Notify the other user that the match was declined */
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

  /* ccc
   *  This function will enter match, meaning it will create an entry in "matches" table,
   *  then it will delete the previous record in the "queue" table, if successful. */
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
    setMatchStatus(true);
    setMatchEntry(matchEntry);
  };

  /* ccc
   *  Handling match state variables when players click the columns... */
  const handleColumnClick = async (colIndex: number) => {
    if (!user || !matchId) return;

    // If player is null, change to red. If it is not null, and it is red, change to green.
    const updateCurrentPlayer =
      user.id === redId ? "red" : user.id === greenId ? "green" : undefined;
    console.log("updateCurrentPlayer: ", updateCurrentPlayer);

    if (updateCurrentPlayer !== currentPlayer) return;

    // Iterate over a particular column, starting from the bottom...
    const updateBoard = board.map((column) => [...column]);
    let placed = false;
    for (let i = 0; i <= updateBoard[colIndex].length - 1; i++) {
      if (updateBoard[colIndex][i] === null) {
        updateBoard[colIndex][i] = updateCurrentPlayer;
        placed = true;
        break;
      }
    }
    if (!placed) {
      return; // Column is full...
    }
    console.log("updateBoard: ", updateBoard);

    const updateMoveNumber: number = moveNumber + 1;

    // Evaluate for a win... Initialized as null, first move sets game inProgress
    let updateGameStatus = checkBoardState(updateBoard);
    console.log("updateGameStatus: ", updateGameStatus);
    if (updateGameStatus === null) {
      console.log("First move made!");
      updateGameStatus = "inProgress";
    }

    // Update match status according to game status
    let updateMatchStatus: boolean = false;
    if (updateGameStatus === "inProgress") {
      updateMatchStatus = true; // Game in progress
    } else if (
      updateGameStatus === "red" ||
      updateGameStatus === "green" ||
      updateGameStatus === "draw"
    ) {
      updateMatchStatus = false; // Game over
    }

    // Turning the TokenBoard array into a JSON string before sending it to database.
    const jsonBoard = JSON.stringify(updateBoard);

    const updateMatchEntry: MatchEntry = {
      match_id: matchId,
      game_status: updateGameStatus,
      match_status: updateMatchStatus,
      red_id: redId,
      green_id: greenId,
      move_number: updateMoveNumber,
      made_move: updateCurrentPlayer,
      board: jsonBoard,
      current_player: updateCurrentPlayer,
    };

    try {
      const { error: updateError } = await supabase
        .from("matches")
        .update(updateMatchEntry)
        .eq("match_id", matchId)
        .select();

      if (updateError) throw updateError;

      setGameStatus(updateGameStatus);
      setMatchStatus(updateMatchStatus);
      setMoveNumber(updateMoveNumber);
      setCurrentPlayer(updateCurrentPlayer);
      setBoard(updateBoard);
    } catch (error) {
      console.error("Error when trying to update 'matches' table: ", error);
    }
  };

  // TODO: Make const endMatch function, pair it with a timeout of some sort to automatically end matches.

  return (
    <div>
      {/*<h2>Queue Status</h2>*/}
      {!isQueued && !matchStatus && (
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
      {matchStatus && <p>You are currently in a match.</p>}

      {/* Conditionally render a leave queue button if the user is in the queue but not yet in a match */}
      {isQueued && !matchFound && (
        <Button onClick={handleLeaveQueue} className="m-4">
          Leave Queue
        </Button>
      )}

      {/* Render information about the current match if the user is in one... */}
      {matchStatus && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "85vh",
          }}
        >
          {/* Clickable columns */}
          <div style={{ display: "flex" }}>
            {matchStatus &&
              board.map((column, columnIndex) => (
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
                {user && gameStatus !== "inProgress" && matchId && (
                  <Alert>
                    Game Over:{" "}
                    {gameStatus === "draw" ? "Draw" : `Winner is ${gameStatus}`}
                  </Alert>
                )}
              </li>
              <li>{user && matchId && <p>Move Number: {moveNumber}</p>}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Multiplayer;
