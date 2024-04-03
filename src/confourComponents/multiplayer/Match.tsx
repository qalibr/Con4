import React, { useEffect, useState } from "react";
import supabase from "@/supabaseClient.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  TokenBoard,
  MatchEntry,
  GameStatus,
  Player,
} from "@/confourComponents/game/types.tsx";

const Match = () => {
  const { user } = useAuth();

  /* NOTE: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   *  Related to "matches" table... */
  const [matchEntry, setMatchEntry] = useState<MatchEntry | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>(null);
  const [redId, setRedId] = useState<string | null>(null);
  const [greenId, setGreenId] = useState<string | null>(null);
  const [moveNumber, setMoveNumber] = useState<number>(0);
  const [madeMove, setMadeMove] = useState<Player>(null);
  const [board, setBoard] = useState<TokenBoard>();
  const [currentPlayer, setCurrentPlayer] = useState<Player>(null);

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
          setBoard(userMatchEntry.board);
          setCurrentPlayer(userMatchEntry.current_player);
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
            setBoard(updateId.board);
            setCurrentPlayer(updateId.current_player);
          }
        },
      )
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
    };
  }, [user]);
};
