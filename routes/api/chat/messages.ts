import {
  DEFAULT_MIN_SONGS_PER_TURN,
  resolveRecommendedSongs,
  streamAssistantTurn,
} from "@/lib/ai/chat.ts";
import type { ChatStreamEvent } from "@/lib/chat/types.ts";
import {
  createChatMessage,
  createChatThread,
  getChatMessageById,
  getChatThread,
  getLatestAssistantResponseId,
  getThreadSongUris,
  setChatThreadConversationId,
  touchChatThread,
  updateChatMessageSongs,
} from "@/lib/db/chat.ts";
import { define } from "@/lib/state.ts";

const toThreadId = (value: unknown) => {
  if (typeof value !== "number") {
    return null;
  }

  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
};

const toTitle = (message: string) => {
  const compact = message.trim().replace(/\s+/g, " ");

  if (!compact) {
    return "New Chat";
  }

  return compact.length <= 60 ? compact : `${compact.slice(0, 57)}...`;
};

const toMessageId = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;

const toRemixSongs = (
  value: unknown,
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const maybeSong = entry as {
        name?: unknown;
        artist?: unknown;
        album?: unknown;
      };
      const name = typeof maybeSong.name === "string"
        ? maybeSong.name.trim()
        : "";
      const artist = typeof maybeSong.artist === "string"
        ? maybeSong.artist.trim()
        : "";
      const album = typeof maybeSong.album === "string"
        ? maybeSong.album.trim()
        : "";

      if (!name || !artist || !album) {
        return null;
      }

      return { name, artist, album };
    })
    .filter((song): song is { name: string; artist: string; album: string } =>
      song !== null
    )
    .slice(0, 80);
};

const toRemixModelPrompt = (
  {
    remixPrompt,
    songs,
  }: {
    remixPrompt: string;
    songs: {
      name: string;
      artist: string;
      album: string;
    }[];
  },
) => {
  const sourceSongs = songs
    .map((song, index) =>
      `${index + 1}. "${song.name}" — ${song.artist} (${song.album})`
    )
    .join("\n");

  return `Remix this exact source set while keeping strong stylistic overlap.
Blend familiar vibes from the source with fresh discoveries.

Source tracks:
${sourceSongs}

User remix request:
${
    remixPrompt ||
    "Give me more songs in this same lane, blended with this source set."
  }`;
};

const toChunk = (event: ChatStreamEvent) =>
  new TextEncoder().encode(`${JSON.stringify(event)}\n`);

const emitEvent = (
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: ChatStreamEvent,
) => {
  controller.enqueue(toChunk(event));
};

const MAX_RESOLVED_SONGS_PER_TURN = 60;

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.session) {
      return new Response("You must be logged in to chat", { status: 401 });
    }

    const body = await ctx.req.json().catch(() => null) as {
      threadId?: unknown;
      message?: unknown;
      remix?: {
        sourceMessageId?: unknown;
        prompt?: unknown;
        songs?: unknown;
      } | unknown;
    } | null;

    const rawMessage = typeof body?.message === "string"
      ? body.message.trim()
      : "";
    const incomingThreadId = toThreadId(body?.threadId);
    const remix = body?.remix && typeof body.remix === "object"
      ? body.remix as {
        sourceMessageId?: unknown;
        prompt?: unknown;
        songs?: unknown;
      }
      : null;
    const remixSourceMessageId = remix
      ? toMessageId(remix.sourceMessageId)
      : null;
    const remixSongs = remix ? toRemixSongs(remix.songs) : [];
    const remixPrompt = remix && typeof remix.prompt === "string"
      ? remix.prompt.trim()
      : "";
    const hasRemixInput = Boolean(remixSourceMessageId) ||
      remixSongs.length > 0;
    const message = rawMessage ||
      (hasRemixInput
        ? `Remix: ${
          remixPrompt || "give me more songs in this lane combined with these"
        }`
        : "");
    const web = true;

    if (!message) {
      return new Response("message is required", { status: 400 });
    }

    const stream = new ReadableStream({
      start: (controller) => {
        void (async () => {
          try {
            let thread = incomingThreadId
              ? await getChatThread(ctx.state.session!, incomingThreadId)
              : null;

            if (!thread) {
              thread = await createChatThread(
                ctx.state.session!,
                toTitle(message),
              );

              emitEvent(controller, { type: "thread_created", thread });
            }

            await createChatMessage(ctx.state.session!, {
              threadId: thread.id,
              role: "user",
              content: message,
            });

            let modelMessage = message;

            if (remixSourceMessageId) {
              const sourceMessage = await getChatMessageById(
                ctx.state.session!,
                {
                  threadId: thread.id,
                  messageId: remixSourceMessageId,
                },
              );

              if (!sourceMessage || !sourceMessage.song_cards?.length) {
                throw new Error("remix source message not found");
              }

              modelMessage = toRemixModelPrompt({
                remixPrompt,
                songs: sourceMessage.song_cards.map((song) => ({
                  name: song.name,
                  artist: song.artists[0]?.name ?? "Unknown Artist",
                  album: song.album.name,
                })),
              });
            } else if (remixSongs.length) {
              modelMessage = toRemixModelPrompt({
                remixPrompt,
                songs: remixSongs,
              });
            }

            const previousResponseId = await getLatestAssistantResponseId(
              ctx.state.session!,
              thread.id,
            );

            const assistant = await streamAssistantTurn({
              message: modelMessage,
              conversationId: thread.openai_conversation_id,
              previousResponseId,
              web,
              onDelta: (delta) =>
                emitEvent(controller, {
                  type: "assistant_delta",
                  delta,
                }),
            });

            if (
              assistant.conversationId &&
              assistant.conversationId !== thread.openai_conversation_id
            ) {
              await setChatThreadConversationId(
                ctx.state.session!,
                thread.id,
                assistant.conversationId,
              );
            }

            const assistantMessage = await createChatMessage(
              ctx.state.session!,
              {
                threadId: thread.id,
                role: "assistant",
                content: assistant.assistantText,
                openaiResponseId: assistant.responseId,
              },
            );

            emitEvent(controller, {
              type: "assistant_done",
              message: assistantMessage,
            });

            const existingSongUris = await getThreadSongUris(
              ctx.state.session!,
              thread.id,
            );
            const desiredSongCount = Math.min(
              MAX_RESOLVED_SONGS_PER_TURN,
              Math.max(
                DEFAULT_MIN_SONGS_PER_TURN,
                assistant.recommendations.length,
              ),
            );
            const songs = await resolveRecommendedSongs(
              assistant.recommendations,
              {
                maxResults: desiredSongCount,
                excludeUris: existingSongUris,
              },
            );

            if (songs.length) {
              await updateChatMessageSongs(ctx.state.session!, {
                threadId: thread.id,
                messageId: assistantMessage.id,
                songCards: songs,
              });

              emitEvent(controller, {
                type: "song_block",
                messageId: assistantMessage.id,
                songs,
              });
            }

            await touchChatThread(ctx.state.session!, thread.id);
          } catch (error) {
            console.error("chat stream failed", error);
            emitEvent(controller, {
              type: "error",
              message: "Chat request failed. Please try again.",
            });
          } finally {
            emitEvent(controller, { type: "done" });
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
      },
    });
  },
});
