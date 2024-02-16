import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    header: () => <div className="text-right">Email</div>,
    cell: ({ getValue }) => {
      const email = getValue() as Friend["email"];

      return <div className="text-right font-medium">{email}</div>;
    },
  },
  {
    accessorKey: "username",
    header: () => <div className="text-right">Username</div>,
    cell: ({ getValue }) => {
      const username = getValue() as Friend["username"];

      return <div className="text-right font-medium">{username}</div>;
    },
  },
  {
    id: "actions",
    // cell: ({ row }) => {
    // const friend = row.original;
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {/*<DropdownMenuItem*/}
            {/*  onClick={() => navigator.clipboard.writeText(friend.id)}*/}
            {/*>*/}
            {/*  Copy Friend ID*/}
            {/*</DropdownMenuItem>*/}
            <DropdownMenuSeparator />
            <DropdownMenuItem>Chat</DropdownMenuItem>
            <DropdownMenuItem>Challenge</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
