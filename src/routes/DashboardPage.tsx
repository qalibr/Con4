import React from "react";
import { FriendList } from "@/confourComponents/FriendListComponent";
import useAuth from "@/confourHooks/useAuth.tsx";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      {user ? (
        <div className="container mx-auto py-10">
          <FriendList />
        </div>
      ) : (
        <div>
          <h2>You must login to use Dashboard.</h2>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
