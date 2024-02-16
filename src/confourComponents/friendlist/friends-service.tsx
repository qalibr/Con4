import { supabase } from "@/supabaseClient";
import { Friend } from "@/confourComponents/friendlist/types.tsx";

export const FetchFriends = async (): Promise<Friend[]> => {
  const { data, error } = await supabase.from("friends").select("*");

  if (error) {
    console.error("Error fetching friends:", error);
    return [];
  }

  return data || [];
};
