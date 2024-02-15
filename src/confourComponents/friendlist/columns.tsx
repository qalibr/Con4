import React from "react";
import { ColumnDef } from "@tanstack/react-table";

export type Friend = {
  id: string;
  username: string;
  status: "online" | "offline" | "busy" | "dnd";
  email: string;
};

const statusMap: { [K in Friend["status"]]: string } = {
  online: "Online",
  offline: "Offline",
  busy: "Busy",
  dnd: "Do Not Disturb",
};

export const columns: ColumnDef<Friend, keyof Friend>[] = [
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ getValue }) => {
      const status = getValue() as Friend["status"];
      const label = statusMap[status];

      return <div className="text-right font-medium">{label}</div>;
    },
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
