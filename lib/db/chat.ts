import { type AppSession, getSessionUserId } from "@/lib/auth.ts";
import type { ChatMessage, ChatRole, ChatThread } from "@/lib/chat/types.ts";
import { createNeonDataApiClient } from "@/lib/db/data_api.ts";
import type { TrackLite } from "@/lib/spotify/api.ts";

const THREAD_FIELDS =
  "id, title, openai_conversation_id, created_at, updated_at";
const MESSAGE_FIELDS =
  "id, thread_id, role, content, song_cards, openai_response_id, created_at";

const now = () => new Date().toISOString();

const parseSongCards = (value: unknown): TrackLite[] | null =>
  Array.isArray(value) ? value as TrackLite[] : null;

const mapMessage = (
  row: {
    id: number;
    thread_id: number;
    role: ChatRole;
    content: string;
    song_cards: unknown;
    openai_response_id: string | null;
    created_at: string;
  },
): ChatMessage => ({
  ...row,
  song_cards: parseSongCards(row.song_cards),
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

export const listChatThreads = async (
  session: AppSession,
  limit: number = 40,
) => {
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_threads")
    .select(THREAD_FIELDS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("error fetching chat threads", error);
    throw error;
  }

  return (data ?? []) as ChatThread[];
};

export const getChatThread = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_threads")
    .select(THREAD_FIELDS)
    .eq("id", threadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("error fetching chat thread", error);
    throw error;
  }

  return (data ?? null) as ChatThread | null;
};

export const createChatThread = async (
  session: AppSession,
  title: string,
) => {
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_threads")
    .insert(
      [{
        user_id: userId,
        title,
        updated_at: now(),
      }],
    )
    .select(THREAD_FIELDS)
    .single();

  if (error) {
    console.error("error creating chat thread", error);
    throw error;
  }

  return data as ChatThread;
};

export const setChatThreadConversationId = async (
  session: AppSession,
  threadId: number,
  openaiConversationId: string,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_threads")
    .update({
      openai_conversation_id: openaiConversationId,
      updated_at: now(),
    })
    .eq("id", threadId)
    .eq("user_id", userId)
    .select(THREAD_FIELDS)
    .maybeSingle();

  if (error) {
    console.error("error updating thread conversation id", error);
    throw error;
  }

  return (data ?? null) as ChatThread | null;
};

export const touchChatThread = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { error } = await client
    .from("chat_threads")
    .update({
      updated_at: now(),
    })
    .eq("id", threadId)
    .eq("user_id", userId);

  if (error) {
    console.error("error touching chat thread", error);
    throw error;
  }
};

export const deleteChatThread = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_threads")
    .delete()
    .eq("id", threadId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("error deleting chat thread", error);
    throw error;
  }

  return Array.isArray(data) && data.length > 0;
};

export const getChatMessages = async (
  session: AppSession,
  threadId: number,
  limit: number = 200,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_messages")
    .select(MESSAGE_FIELDS)
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .order("id", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("error fetching chat messages", error);
    throw error;
  }

  return (data ?? []).map((row) =>
    mapMessage(
      row as {
        id: number;
        thread_id: number;
        role: ChatRole;
        content: string;
        song_cards: unknown;
        openai_response_id: string | null;
        created_at: string;
      },
    )
  );
};

export const getLatestAssistantResponseId = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_messages")
    .select("openai_response_id")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .eq("role", "assistant")
    .not("openai_response_id", "is", null)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("error fetching latest assistant response id", error);
    throw error;
  }

  return (data?.openai_response_id ?? null) as string | null;
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
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_messages")
    .select(MESSAGE_FIELDS)
    .eq("thread_id", threadId)
    .eq("id", messageId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("error fetching chat message by id", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapMessage(
    data as {
      id: number;
      thread_id: number;
      role: ChatRole;
      content: string;
      song_cards: unknown;
      openai_response_id: string | null;
      created_at: string;
    },
  );
};

export const getThreadSongUris = async (
  session: AppSession,
  threadId: number,
) => {
  parseThreadId(threadId);
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_messages")
    .select("song_cards")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .not("song_cards", "is", null)
    .order("id", { ascending: true });

  if (error) {
    console.error("error fetching thread song uris", error);
    throw error;
  }

  const uris = (data ?? []).flatMap((row) => {
    const cards = parseSongCards(
      (row as {
        song_cards: unknown;
      }).song_cards,
    );

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
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_messages")
    .insert(
      [{
        thread_id: threadId,
        user_id: userId,
        role,
        content,
        song_cards: songCards,
        openai_response_id: openaiResponseId,
      }],
    )
    .select(MESSAGE_FIELDS)
    .single();

  if (error) {
    console.error("error creating chat message", error);
    throw error;
  }

  return mapMessage(
    data as {
      id: number;
      thread_id: number;
      role: ChatRole;
      content: string;
      song_cards: unknown;
      openai_response_id: string | null;
      created_at: string;
    },
  );
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
  const userId = getSessionUserId(session);
  const client = createNeonDataApiClient(session);
  const { data, error } = await client
    .from("chat_messages")
    .update({
      song_cards: songCards,
    })
    .eq("id", messageId)
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .select(MESSAGE_FIELDS)
    .maybeSingle();

  if (error) {
    console.error("error updating chat message songs", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapMessage(
    data as {
      id: number;
      thread_id: number;
      role: ChatRole;
      content: string;
      song_cards: unknown;
      openai_response_id: string | null;
      created_at: string;
    },
  );
};
