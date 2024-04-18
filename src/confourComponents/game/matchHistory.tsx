import { GameStatus, Player } from "@/confourComponents/game/types.tsx";

export interface MatchHistory {
        game_status: GameStatus | Player;
        red_id: string | null;
        green_id: string | null;
}