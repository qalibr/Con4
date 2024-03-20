import {
  InstanceStatus,
  PlayerStatus,
} from "@/confourComponents/multiplayer/multiplayer-types.tsx";

import { Player, GameStatus } from "@/confourComponents/game/types.tsx";

export interface IMultiplayerGame {
  game_id: string;
  instance_status: InstanceStatus;
  game_creator: string;
  player_count: number;
  red_ready: PlayerStatus;
  player_id_red: string;
  green_ready: PlayerStatus;
  player_id_green: string;
  move_number: number;
  made_move: string;
  board: string;
  current_player: Player;
  game_status: GameStatus;
}
