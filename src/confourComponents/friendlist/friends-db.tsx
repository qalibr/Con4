import { supabase } from "@/supabaseClient.tsx";
import { Friend } from "@/confourComponents/friendlist/types.tsx";

export const addFriend = async (
  profileData: Omit<Friend, "id">,
  user_id: string,
) => {
  const userProfileData = { ...profileData, user_id };
  const { data, error } = await supabase
    .from("friends")
    .insert([userProfileData]);

  return { data, error };
};

export const updateFriend = async (
  id: string,
  profileData: Omit<Friend, "id">,
  user_id: string,
) => {
  const { data, error } = await supabase
    .from("friends")
    .update({ ...profileData, user_id })
    .match({ id, user_id });

  return { data, error };
};
