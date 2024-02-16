import { supabase } from "@/supabaseClient.tsx";
import { Friend } from "@/confourComponents/friendlist/types.tsx";

export const addFriend = async (profileData: Omit<Friend, "id">) => {
  const { data, error } = await supabase.from("friends").insert([profileData]);
  return { data, error };
};

export const updateFriend = async (
  id: string,
  profileData: Omit<Friend, "id">,
) => {
  const { data, error } = await supabase
    .from("friends")
    .update(profileData)
    .match({ id });
  return { data, error };
};
