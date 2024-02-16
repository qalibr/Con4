import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/confourComponents/friendlist/data-table";
import { Friend, columns } from "@/confourComponents/friendlist/columns";
import { FriendForm } from "@/confourComponents/friendlist/friend-form.tsx";

async function getData(): Promise<Friend[]> {
  return [];
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
    <ul className="flex">
      <li>
        <ScrollArea className="h-screen w-fit rounded-md border">
          <div className="p-4">
            <h4 className="mb-4 text-sm font-medium leading-none">
              Friend List
            </h4>
            <DataTable columns={columns} data={friends} />
          </div>
        </ScrollArea>
      </li>
      <li className="mr-4 rounded-md">
        <div className="p-4 border">
          <FriendForm initialData={undefined} onSubmitSuccess={undefined} />
        </div>
      </li>
    </ul>
  );
};
