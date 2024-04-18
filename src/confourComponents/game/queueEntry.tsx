import { QueueCount } from "@/confourComponents/game/types.tsx";

export interface QueueEntry {
        match_id: string | null;
        match_found: boolean;
        red_id: string | null;
        red_status: boolean | null;
        green_id: string | null;
        green_status: boolean | null;
        queue_count: QueueCount;
        red_ready: boolean;
        green_ready: boolean;
}