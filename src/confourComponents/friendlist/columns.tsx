import React, { JSX } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Friend } from "@/confourComponents/friendlist/types.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const statusMap: { [K in Friend["status"]]: JSX.Element } = {
  online: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#10B981" // Tailwind CSS Green-500
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  offline: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="#9CA3AF" // Tailwind CSS Gray-400
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  ),
  away: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="#F59E0B" // Tailwind CSS Yellow-500
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  ),
  dnd: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="#EF4444" // Tailwind CSS Red-500
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  ),
};

export const columns: ColumnDef<Friend, keyof Friend>[] = [
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ getValue }) => {
      const status = getValue() as Friend["status"];
      const icon = statusMap[status];

      return <div className="text-right font-medium">{icon}</div>;
    },
  },
  // {
  //   accessorKey: "email",
  //   header: () => <div className="text-right">Email</div>,
  //   cell: ({ getValue }) => {
  //     const email = getValue() as Friend["email"];
  //
  //     return <div className="text-right font-medium">{email}</div>;
  //   },
  // },
  {
    accessorKey: "username",
    header: () => <div className="text-right">Username</div>,
    cell: ({ row }) => {
      const username = row.original.username;
      const email = row.original.email;
      return (
        <div className="text-right font-medium">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">{username}</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit p-4 shadow-lg rounded-lg overflow-hidden">
              <div className="flex mx-auto whitespace-normal break-words">
                {email}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      );
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
