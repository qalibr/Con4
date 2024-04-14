import React, { useEffect, useState } from "react";
import useAuth from "@/confourHooks/useAuth.tsx";
import supabase from "@/supabaseClient.tsx";

// https://youtu.be/IfImokndvfM Track online users

// Function to track number of users online.
// This is a prototype preparation for establishing multiplayer.
function OnlineTracker() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const channel = supabase.channel("tracking");

    channel
      .on("presence", { event: "sync" }, () => {
        const userId = [];
        for (const id in channel.presenceState()) {
          // @ts-expect-error possible error due to user_id not existing on type
          userId.push(channel.presenceState()[id][0].user_id);
        }

        setOnlineUsers([...new Set(userId)].length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && user) {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return (
    <div className="flex items-center gap-1">
      <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
      <h1 className="text-sm text-gray-400">{onlineUsers} online</h1>
    </div>
  );
}

export default OnlineTracker;
