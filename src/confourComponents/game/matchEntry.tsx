import { GameStatus, Player } from "@/confourComponents/game/types.tsx";

export interface MatchEntry {
        id: number | undefined;
        created_at: string | undefined;
        match_id: string | null;
        match_status: boolean; // Variable to mark a match as going from matchmaking to active
        game_status: GameStatus | Player;
        red_id: string | null;
        green_id: string | null;
        move_number: number;
        made_move: Player;
        current_player: Player;
        board: string; // Stored in database as JSON, so here it will be string.
        match_concluded: boolean; // Variable to mark matches as finished
        red_username: string;
        green_username: string;
}