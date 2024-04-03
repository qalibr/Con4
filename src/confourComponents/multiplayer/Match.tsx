import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";
import {
  GameStatus,
  MatchEntry,
  Player,
  TokenBoard,
} from "@/confourComponents/game/types.tsx";
import {
  checkBoardState,
  generateEmptyBoard,
} from "@/confourComponents/game/game-logic.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert } from "@/components/ui/alert.tsx";

const Match = () => {
  const { user } = useAuth();

  /* NOTE: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  Related to "matches" table... */
  const [matchEntry, setMatchEntry] = useState<MatchEntry | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<GameStatus | Player>(null);
  const [redId, setRedId] = useState<string | null>(null);
  const [greenId, setGreenId] = useState<string | null>(null);
  const [moveNumber, setMoveNumber] = useState<number>(0);
  const [madeMove, setMadeMove] = useState<Player>(undefined);
  const [board, setBoard] = useState<TokenBoard>(generateEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(undefined);

  useEffect(() => {
    if (!user) return;

    const fetchingEntries = async () => {
      try {
        const { data: matchData, error: fetchError } = await supabase
          .from("matches")
          .select("*");

        if (fetchError) throw fetchError;

        // NOTE: Fetching all match data, and then look for current user.
        //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // Make sure the person playing is the current user...
        const userMatchEntry = matchData.find(
          (entry) => entry.red_id === user.id || entry.green_id === user.id,
        );

        if (userMatchEntry) {
          setMatchEntry(userMatchEntry);
          setMatchId(userMatchEntry.match_id);
          setMatchStatus(userMatchEntry.match_status);
          setGameStatus(userMatchEntry.game_status);
          setRedId(userMatchEntry.red_id);
          setGreenId(userMatchEntry.green_id);
          setMoveNumber(userMatchEntry.move_number);
          setMadeMove(userMatchEntry.made_move);
          setCurrentPlayer(userMatchEntry.current_player);

          // Parsing the JSON back into a TokenBoard array.
          const fetchedBoard: TokenBoard = JSON.parse(userMatchEntry.board);
          setBoard(fetchedBoard);
          console.log("Match data fetched...", userMatchEntry);
        }
      } catch (error) {
        console.error("Error fetching entries from 'matches' table: ", error);
      }
    };

    fetchingEntries();

    const matchChannel = supabase
      .channel(`matches-game`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          console.log("Match changed: ", payload);
          fetchingEntries();
          const updateId = payload.new as MatchEntry;
          if (updateId) {
            setMatchId(updateId.match_id);
            setMatchStatus(updateId.match_status);
            setGameStatus(updateId.game_status);
            setRedId(updateId.red_id);
            setGreenId(updateId.green_id);
            setMoveNumber(updateId.move_number);
            setMadeMove(updateId.made_move);
            setCurrentPlayer(updateId.current_player);

            const updateBoard: TokenBoard = JSON.parse(updateId.board);
            setBoard(updateBoard);
          } else if (updateId === null) {
            setMatchEntry(null);
          }
        },
      )
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
    };
  }, [user]);

  const handleColumnClick = async (colIndex: number) => {
    if (!user || !matchId) return;

    // If player is null, change to red. If it is not null, and it is red, change to green.
    const updateCurrentPlayer =
      user.id === redId ? "red" : user.id === greenId ? "green" : undefined;

    console.log("Ping");
    if (updateCurrentPlayer !== currentPlayer) return;
    console.log("Making move...");

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
    const updateMoveNumber: number = moveNumber + 1;

    // Evaluate for a win... Initialized as null, first move sets game inProgress
    let updateGameStatus = checkBoardState(updateBoard);
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

  const handleDeleteMatch = async () => {
    if (!user) return;

    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .match({ match_id: matchId });

    if (deleteError) {
      console.error("Error deleting queue entry: ", deleteError);
      return;
    } else {
      console.log("Queue entry successfully deleted...");
      setMatchEntry(null);
      setMatchStatus(false);
    }
  };

  return (
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

      {user && matchStatus && (
        <div>
          <Button onClick={handleDeleteMatch}>
            (Debug) Delete Match Record
          </Button>
        </div>
      )}

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
  );
};

export default Match;
