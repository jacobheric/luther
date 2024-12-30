import { supabase } from "@/lib/db/supabase.ts";
import { Session } from "@supabase/supabase-js";

export const saveSearch = async (session: Session, search: string) => {
  supabase.auth.setSession(session);
  const user = await supabase.auth.getUser(session.access_token);

  const { error } = await supabase
    .from("searches")
    .upsert({ user_id: user.data.user?.id, search }, {
      onConflict: "user_id,search",
    });

  if (error) {
    console.error("error saving search", error);
  }
};

export const getSearchHistory = async (
  session: Session,
  limit: number = 20,
) => {
  supabase.auth.setSession(session);
  const user = await supabase.auth.getUser(session.access_token);

  const { data, error } = await supabase
    .from("searches")
    .select("*")
    .eq("user_id", user.data.user?.id)
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("error fetching search history", error);
    throw error;
  }

  return data;
};

export const deleteSearchHistory = async (
  session: Session,
  id: string,
) => {
  supabase.auth.setSession(session);
  const user = await supabase.auth.getUser(session.access_token);

  const { data, error } = await supabase
    .from("searches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.data.user?.id);

  if (error) {
    console.error("error deleting search history", error);
    throw error;
  }

  return data;
};
