import { type AppSession, getSessionUserId } from "@/lib/auth.ts";
import type { ChatMessage, ChatRole, ChatThread } from "@/lib/chat/types.ts";
import { sql } from "@/lib/db/sql.ts";
import type { TrackLite } from "@/lib/spotify/api.ts";

type ThreadRow = {
  id: number;
  title: string;
  openai_conversation_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type MessageRow = {
  id: number;
  thread_id: number;
  role: ChatRole;
  content: string;
  song_cards: unknown;
  openai_response_id: string | null;
  created_at: string | Date;
};

const parseSongCards = (value: unknown): TrackLite[] | null =>
  Array.isArray(value) ? value as TrackLite[] : null;

const toIsoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const mapThread = (row: ThreadRow): ChatThread => ({
  id: row.id,
  title: row.title,
  openai_conversation_id: row.openai_conversation_id,
  created_at: toIsoString(row.created_at),
  updated_at: toIsoString(row.updated_at),
});

const mapMessage = (row: MessageRow): ChatMessage => ({
  id: row.id,
  thread_id: row.thread_id,
  role: row.role,
  content: row.content,
  song_cards: parseSongCards(row.song_cards),
  openai_response_id: row.openai_response_id,
  created_at: toIsoString(row.created_at),
});

const parseThreadId = (threadId: number) => {
  if (!Number.isInteger(threadId) || threadId <= 0) {
    throw new Error("threadId must be a positive integer");
  }
};

const parseMessageId = (messageId: number) => {
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw new Error("messageId must be a positive integer");
  }
};

const toJsonb = (value: unknown) =>
  value === null || value === undefined ? null : JSON.stringify(value);

export const listChatThreads = async (
  session: AppSession,
  limit: number = 40,
) => {
  const userId = getSessionUserId(session);
  const rows = await sql<ThreadRow[]>`
    select id, title, openai_conversation_id, created_at, updated_at
    from public.chat_threads
    where user_id = ${userId}
    order by updated_at desc
    limit ${limit}
  `;

  return rows.map(mapThread);
};

export const getChatThread = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const [row] = await sql<ThreadRow[]>`
    select id, title, openai_conversation_id, created_at, updated_at
    from public.chat_threads
    where id = ${threadId}
      and user_id = ${userId}
    limit 1
  `;

  return row ? mapThread(row) : null;
};

export const createChatThread = async (
  session: AppSession,
  title: string,
) => {
  const userId = getSessionUserId(session);
  const [row] = await sql<ThreadRow[]>`
    insert into public.chat_threads (
      user_id,
      title,
      updated_at
    )
    values (
      ${userId},
      ${title},
      now()
    )
    returning id, title, openai_conversation_id, created_at, updated_at
  `;

  return mapThread(row);
};

export const setChatThreadConversationId = async (
  session: AppSession,
  threadId: number,
  openaiConversationId: string,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const [row] = await sql<ThreadRow[]>`
    update public.chat_threads
    set
      openai_conversation_id = ${openaiConversationId},
      updated_at = now()
    where id = ${threadId}
      and user_id = ${userId}
    returning id, title, openai_conversation_id, created_at, updated_at
  `;

  return row ? mapThread(row) : null;
};

export const touchChatThread = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);

  await sql`
    update public.chat_threads
    set updated_at = now()
    where id = ${threadId}
      and user_id = ${userId}
  `;
};

export const deleteChatThread = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const rows = await sql<{ id: number }[]>`
    delete from public.chat_threads
    where id = ${threadId}
      and user_id = ${userId}
    returning id
  `;

  return rows.length > 0;
};

export const getChatMessages = async (
  session: AppSession,
  threadId: number,
  limit: number = 200,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const rows = await sql<MessageRow[]>`
    select id, thread_id, role, content, song_cards, openai_response_id, created_at
    from public.chat_messages
    where thread_id = ${threadId}
      and user_id = ${userId}
    order by id asc
    limit ${limit}
  `;

  return rows.map(mapMessage);
};

export const getLatestAssistantResponseId = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const [row] = await sql<{ openai_response_id: string | null }[]>`
    select openai_response_id
    from public.chat_messages
    where thread_id = ${threadId}
      and user_id = ${userId}
      and role = 'assistant'
      and openai_response_id is not null
    order by id desc
    limit 1
  `;

  return row?.openai_response_id ?? null;
};

export const getChatMessageById = async (
  session: AppSession,
  {
    threadId,
    messageId,
  }: {
    threadId: number;
    messageId: number;
  },
) => {
  parseThreadId(threadId);
  parseMessageId(messageId);
  const userId = getSessionUserId(session);
  const [row] = await sql<MessageRow[]>`
    select id, thread_id, role, content, song_cards, openai_response_id, created_at
    from public.chat_messages
    where thread_id = ${threadId}
      and id = ${messageId}
      and user_id = ${userId}
    limit 1
  `;

  return row ? mapMessage(row) : null;
};

export const getThreadSongUris = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const rows = await sql<{ song_cards: unknown }[]>`
    select song_cards
    from public.chat_messages
    where thread_id = ${threadId}
      and user_id = ${userId}
      and song_cards is not null
    order by id asc
  `;

  const uris = rows.flatMap((row) => {
    const cards = parseSongCards(row.song_cards);
    return (cards ?? []).map((card) => card.uri);
  });

  return [...new Set(uris)];
};

export const createChatMessage = async (
  session: AppSession,
  {
    threadId,
    role,
    content,
    songCards = null,
    openaiResponseId = null,
  }: {
    threadId: number;
    role: ChatRole;
    content: string;
    songCards?: TrackLite[] | null;
    openaiResponseId?: string | null;
  },
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const [row] = await sql<MessageRow[]>`
    insert into public.chat_messages (
      thread_id,
      user_id,
      role,
      content,
      song_cards,
      openai_response_id
    )
    values (
      ${threadId},
      ${userId},
      ${role},
      ${content},
      ${toJsonb(songCards)}::jsonb,
      ${openaiResponseId}
    )
    returning id, thread_id, role, content, song_cards, openai_response_id, created_at
  `;

  return mapMessage(row);
};

export const updateChatMessageSongs = async (
  session: AppSession,
  {
    threadId,
    messageId,
    songCards,
  }: {
    threadId: number;
    messageId: number;
    songCards: TrackLite[];
  },
) => {
  parseThreadId(threadId);
  parseMessageId(messageId);
  const userId = getSessionUserId(session);
  const [row] = await sql<MessageRow[]>`
    update public.chat_messages
    set song_cards = ${toJsonb(songCards)}::jsonb
    where id = ${messageId}
      and thread_id = ${threadId}
      and user_id = ${userId}
    returning id, thread_id, role, content, song_cards, openai_response_id, created_at
  `;

  return row ? mapMessage(row) : null;
};
