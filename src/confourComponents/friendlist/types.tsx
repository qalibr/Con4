export interface Friend {
  id?: string;
  username: string;
  status: "online" | "offline" | "away" | "dnd";
  email: string;
}
