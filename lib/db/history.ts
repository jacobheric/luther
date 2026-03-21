import { type AppSession, getSessionUserId } from "@/lib/auth.ts";
import { createNeonDataApiClient } from "@/lib/db/data_api.ts";

export type SearchHistoryRow = {
  id: number;
  search: string;
  created_at: string;
};

export const saveSearch = async (session: AppSession, search: string) => {
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);

  const { error } = await client
    .from("searches")
    .upsert(
      [{
        user_id: userId,
        search,
        created_at: new Date().toISOString(),
      }],
      { onConflict: "user_id,search" },
    );

  if (error) {
    console.error("error saving search", error);
  }
};

export const getSearchHistory = async (
  session: AppSession,
  limit: number = 20,
) => {
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("searches")
    .select("id, search, created_at")
    .eq("user_id", userId)
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("error fetching search history", error);
    throw error;
  }

  return (data ?? []) as SearchHistoryRow[];
};

export const deleteSearchHistory = async (
  session: AppSession,
  id: string,
) => {
  const userId = getSessionUserId(session);
  const numericId = Number.parseInt(id, 10);
  const client = createNeonDataApiClient(session);

  if (Number.isNaN(numericId)) {
    throw new Error("Search history id must be an integer");
  }

  const { data, error } = await client
    .from("searches")
    .delete()
    .eq("id", numericId)
    .eq("user_id", userId)
    .select("id, search, created_at");

  if (error) {
    console.error("error deleting search history", error);
    throw error;
  }

  return (data ?? []) as SearchHistoryRow[];
};
