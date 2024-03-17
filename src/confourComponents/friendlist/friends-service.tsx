import { supabase } from "@/supabaseClient";
import { Friend } from "@/confourComponents/friendlist/types.tsx";

export const FetchFriends = async (user_id: string): Promise<Friend[]> => {
  const { data, error } = await supabase
    .from("friends")
    .select("*")
    .eq("user_id", user_id);

  if (error) {
    console.error("Error fetching friends:", error);
    return [];
  }

  return data || [];
};
