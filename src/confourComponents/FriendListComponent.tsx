import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/confourComponents/friendlist/data-table";
import { Friend, columns } from "@/confourComponents/friendlist/columns";

async function getData(): Promise<Friend[]> {
  return [
    {
      id: "285ed52f",
      username: "Bob",
      status: "offline",
      email: "notinuse@gmail.com",
    },
    {
      id: "b23ee515",
      username: "Alice",
      status: "online",
      email: "aliceexample@gmail.com",
    },
    {
      id: "c45de672",
      username: "Charlie",
      status: "away",
      email: "charlieaway@example.com",
    },
    {
      id: "d67fg834",
      username: "Dana",
      status: "dnd",
      email: "danadoesnotdisturb@example.com",
    },
    {
      id: "e89gh901",
      username: "Evan",
      status: "online",
      email: "evanonline@example.com",
    },
    {
      id: "f01ij123",
      username: "Fiona",
      status: "offline",
      email: "fionaoffline@example.com",
    },
    {
      id: "g23kl456",
      username: "George",
      status: "away",
      email: "georgeaway@example.com",
    },
    {
      id: "h45mn789",
      username: "Hannah",
      status: "dnd",
      email: "hannahdnd@example.com",
    },
    {
      id: "i67no012",
      username: "Ian",
      status: "online",
      email: "ianonline@example.com",
    },
    {
      id: "j89pq345",
      username: "Julia",
      status: "offline",
      email: "juliaoffline@example.com",
    },
    {
      id: "k01rs678",
      username: "Kyle",
      status: "away",
      email: "kyleaway@example.com",
    },
    {
      id: "l23tu901",
      username: "Lena",
      status: "dnd",
      email: "lenadnd@example.com",
    },
    {
      id: "m45vw234",
      username: "Mike",
      status: "online",
      email: "mikeonline@example.com",
    },
    {
      id: "n67xy567",
      username: "Nina",
      status: "offline",
      email: "ninaoffline@example.com",
    },
    {
      id: "o89z8901",
      username: "Oscar",
      status: "away",
      email: "oscaraway@example.com",
    },
  ];
}

export const FriendList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      setFriends(data);
    };

    fetchData();
  }, []);

  return (
    <ScrollArea className="h-screen w-fit rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Friend List</h4>
        <DataTable columns={columns} data={friends} />
      </div>
    </ScrollArea>
  );
};
