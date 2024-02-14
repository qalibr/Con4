import { useEffect, useState } from "react";
import { Friend, columns } from "@/confourComponents/friendlist/columns.tsx";
import { DataTable } from "@/confourComponents/friendlist/data-table.tsx";

async function getData(): Promise<Friend[]> {
  return [
    {
      id: "285ed52f",
      username: "Bob",
      status: "offline",
      email: "notinuse@gmail.com",
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

  return <DataTable columns={columns} data={friends} />;
};
