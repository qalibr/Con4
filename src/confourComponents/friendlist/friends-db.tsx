import { supabase } from "@/supabaseClient.tsx";

export const addFriend = async (profileData) => {
  const { data, error } = await supabase.from("friends").insert([profileData]);
  return { data, error };
};

export const updateFriend = async (id, profileData) => {
  const { data, error } = await supabase
    .from("friends")
    .update(profileData)
    .match({ id });
  return { data, error };
};
