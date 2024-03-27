import {QueuedPlayerStatus} from "@/confourComponents/multiplayer/multiplayer-types.tsx";

export interface IQueuedPlayer {
        queue_id: string;
        queued_player_id: string;
        queue_entry_status: QueuedPlayerStatus;
        queue_entry_created_at: Date;
}
