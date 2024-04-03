import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/confourComponents/friendlist/data-table";
import { columns } from "@/confourComponents/friendlist/columns";
import { FriendForm } from "@/confourComponents/friendlist/friend-form.tsx";
import { Friend } from "@/confourComponents/friendlist/types.tsx";
import { FetchFriends } from "@/confourComponents/friendlist/friends-service.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";

export const FriendList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    if (user) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (userId: string) => {
    const friendsData = await FetchFriends(userId);
    setFriends(friendsData);
  };

  const handleFormSuccess = (newFriend: Friend) => {
    setFriends((prevFriends) => [...prevFriends, newFriend]);
  };

  // TODO: Add loading animation during fetching
  // Future: This fetches from database, can we store this with the user
  // during session?
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
          <FriendForm
            initialData={undefined}
            onSubmitSuccess={handleFormSuccess}
          />
        </div>
      </li>
    </ul>
  );
};
