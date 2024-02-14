import { ColumnDef } from "@tanstack/react-table";

export type Friend = {
  id: string;
  username: string;
  status: "online" | "offline" | "busy" | "do-not-disturb";
  email: string;
};

export const columns: ColumnDef<Friend>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
];
