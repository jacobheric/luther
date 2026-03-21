import { type AppSession, getSessionUserId } from "@/lib/auth.ts";
import { sql } from "@/lib/db/sql.ts";

export type SearchHistoryRow = {
  id: number;
  search: string;
  created_at: string;
};

export const saveSearch = async (session: AppSession, search: string) => {
  const userId = getSessionUserId(session);

  try {
    await sql`
      insert into public.searches (user_id, search)
      values (${userId}::uuid, ${search})
      on conflict (user_id, search)
      do update set created_at = now()
    `;
  } catch (error) {
    console.error("error saving search", error);
  }
};

export const getSearchHistory = async (
  session: AppSession,
  limit: number = 20,
) => {
  const userId = getSessionUserId(session);

  try {
    return await sql<SearchHistoryRow[]>`
      select id, search, created_at
      from public.searches
      where user_id = ${userId}::uuid
      order by id desc
      limit ${limit}
    `;
  } catch (error) {
    console.error("error fetching search history", error);
    throw error;
  }
};

export const deleteSearchHistory = async (
  session: AppSession,
  id: string,
) => {
  const userId = getSessionUserId(session);

  try {
    return await sql<SearchHistoryRow[]>`
      delete from public.searches
      where id = ${id}::integer
        and user_id = ${userId}::uuid
      returning id, search, created_at
    `;
  } catch (error) {
    console.error("error deleting search history", error);
    throw error;
  }
};
