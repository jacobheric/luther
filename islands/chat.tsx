import { Modal } from "@/islands/modal.tsx";
import { PlaylistModal } from "@/islands/playlist.tsx";
import { Devices } from "@/islands/devices.tsx";
import type {
  ChatMessage,
  ChatStreamEvent,
  ChatThread,
} from "@/lib/chat/types.ts";
import type { TrackLite } from "@/lib/spotify/api.ts";
import type { Device } from "@spotify/web-api-ts-sdk";
import { Cover } from "@/islands/cover.tsx";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { JSX } from "preact";
import Trash from "tabler-icons/tsx/trash.tsx";
import Plus from "tabler-icons/tsx/plus.tsx";

type MessageView = Omit<ChatMessage, "id"> & {
  id: number | string;
};

const PLAYLIST_MODAL_ID = "chat-add-to-playlist";
const REMIX_MODAL_ID = "chat-remix";

const nowIso = () => new Date().toISOString();

const parseNdjson = async (
  response: Response,
  onEvent: (event: ChatStreamEvent) => void,
) => {
  if (!response.body) {
    return;
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      try {
        onEvent(JSON.parse(line) as ChatStreamEvent);
      } catch (error) {
        console.error("failed parsing chat stream event", line, error);
      }
    }
  }
};

const toMessageView = (message: ChatMessage): MessageView => ({
  ...message,
  id: message.id,
});

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const Chat = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPlaylistUris, setPendingPlaylistUris] = useState<string[]>([]);
  const [remixSourceMessageId, setRemixSourceMessageId] = useState<
    number | null
  >(null);
  const [remixPrompt, setRemixPrompt] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasSongs = useMemo(
    () =>
      messages.some((message) =>
        message.role === "assistant" && (message.song_cards?.length ?? 0) > 0
      ),
    [messages],
  );

  const fetchThreads = async () => {
    const response = await fetch("/api/chat/threads");

    if (!response.ok) {
      throw new Error("failed to load threads");
    }

    const nextThreads = await response.json() as ChatThread[];
    setThreads(nextThreads);

    return nextThreads;
  };

  const fetchMessages = async (threadId: number) => {
    setLoadingThread(true);

    try {
      const response = await fetch(`/api/chat/threads/${threadId}/messages`);

      if (!response.ok) {
        throw new Error("failed to load messages");
      }

      const nextMessages = await response.json() as ChatMessage[];
      setMessages(nextMessages.map(toMessageView));
    } catch (error) {
      console.error("failed to fetch thread messages", error);
      setError("Could not load chat messages. Please refresh.");
    } finally {
      setLoadingThread(false);
    }
  };

  const openThread = async (threadId: number) => {
    setActiveThreadId(threadId);
    setError(null);
    await fetchMessages(threadId);
  };

  useEffect(() => {
    void (async () => {
      try {
        const nextThreads = await fetchThreads();

        if (!nextThreads.length) {
          return;
        }

        setActiveThreadId(nextThreads[0].id);
        await fetchMessages(nextThreads[0].id);
      } catch (error) {
        console.error("failed to initialize chat", error);
        setError("Could not load your chat history. Please refresh.");
      }
    })();
  }, []);

  const resetForNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    setError(null);
  };

  const getSelectedDevice = () =>
    (document.getElementById("device") as HTMLSelectElement | null)?.value ??
      "";

  const withAction = async (key: string, action: () => Promise<void>) => {
    setActionKey(key);
    setError(null);

    try {
      await action();
    } catch (error) {
      console.error("spotify action failed", error);
      setError("Spotify action failed. Please try again.");
    } finally {
      setActionKey(null);
    }
  };

  const sendSpotifyAction = async (
    {
      endpoint,
      uris,
      playlistId,
      playlistName,
      actionName,
    }: {
      endpoint:
        | "/api/spotify/play"
        | "/api/spotify/queue"
        | "/api/spotify/playlist";
      uris: string[];
      playlistId?: string;
      playlistName?: string;
      actionName: string;
    },
  ) => {
    if (endpoint !== "/api/spotify/playlist") {
      const device = getSelectedDevice();

      if (!device) {
        throw new Error("no spotify device selected");
      }

      const formData = new FormData();
      formData.append("device", device);
      uris.forEach((uri) => formData.append("trackURI", uri));

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`spotify ${actionName} failed`);
      }

      return;
    }

    const formData = new FormData();
    uris.forEach((uri) => formData.append("trackURI", uri));

    if (playlistId) {
      formData.append("playlistId", playlistId);
    }

    if (playlistName) {
      formData.append("playlistName", playlistName);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`spotify ${actionName} failed`);
    }
  };

  const submit = async (
    {
      message,
      remix,
    }: {
      message?: string;
      remix?: {
        sourceMessageId: number;
        prompt?: string;
      };
    } = {},
  ) => {
    const content = (message ?? prompt).trim();

    if (!content || submitting) {
      return;
    }

    const tempUserId = `user-${Date.now()}`;
    const tempAssistantId = `assistant-${Date.now()}`;

    setError(null);
    setSubmitting(true);
    if (!message) {
      setPrompt("");
    }
    setMessages((current) => [
      ...current,
      {
        id: tempUserId,
        thread_id: activeThreadId ?? 0,
        role: "user",
        content,
        song_cards: null,
        openai_response_id: null,
        created_at: nowIso(),
      },
      {
        id: tempAssistantId,
        thread_id: activeThreadId ?? 0,
        role: "assistant",
        content: "",
        song_cards: null,
        openai_response_id: null,
        created_at: nowIso(),
      },
    ]);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: activeThreadId,
          message: content,
          ...(remix ? { remix } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("failed to stream chat");
      }

      await parseNdjson(response, (event) => {
        if (event.type === "thread_created") {
          setThreads((current) => {
            const deduped = current.filter((thread) =>
              thread.id !== event.thread.id
            );
            return [event.thread, ...deduped];
          });
          setActiveThreadId(event.thread.id);
          return;
        }

        if (event.type === "assistant_delta") {
          setMessages((current) =>
            current.map((message) =>
              message.id === tempAssistantId
                ? { ...message, content: `${message.content}${event.delta}` }
                : message
            )
          );
          return;
        }

        if (event.type === "assistant_done") {
          setMessages((current) => {
            const replaced = current.map((message) =>
              message.id === tempAssistantId
                ? toMessageView(event.message)
                : message
            );

            if (replaced.some((message) => message.id === event.message.id)) {
              return replaced;
            }

            return [...replaced, toMessageView(event.message)];
          });
          return;
        }

        if (event.type === "song_block") {
          setMessages((current) =>
            current.map((message) =>
              message.id === event.messageId
                ? { ...message, song_cards: event.songs }
                : message
            )
          );
          return;
        }

        if (event.type === "error") {
          setError(event.message);
        }
      });

      const nextThreads = await fetchThreads();
      const candidateThreadId = activeThreadId ?? nextThreads[0]?.id ?? null;

      if (candidateThreadId) {
        setActiveThreadId(candidateThreadId);
      }
    } catch (error) {
      console.error("chat submit failed", error);
      setError("Chat failed. Please try again.");
      setMessages((current) =>
        current.filter((message) => message.id !== tempAssistantId)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteThread = async (threadId: number) => {
    try {
      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("failed to delete thread");
      }

      const remaining = threads.filter((thread) => thread.id !== threadId);
      setThreads(remaining);

      if (activeThreadId !== threadId) {
        return;
      }

      if (!remaining.length) {
        resetForNewChat();
        return;
      }

      await openThread(remaining[0].id);
    } catch (error) {
      console.error("failed to delete thread", error);
      setError("Failed to delete chat thread.");
    }
  };

  const startPlaylistFlow = (uris: string[]) => {
    setPendingPlaylistUris(uris);
    (document.getElementById(PLAYLIST_MODAL_ID) as HTMLDialogElement)
      ?.showModal();
  };

  const startRemixFlow = (messageId: number | string) => {
    if (typeof messageId !== "number") {
      return;
    }

    setRemixSourceMessageId(messageId);
    setRemixPrompt("");
    (document.getElementById(REMIX_MODAL_ID) as HTMLDialogElement)
      ?.showModal();
  };

  const renderSongCard = (
    song: TrackLite,
    messageId: string | number,
    index: number,
  ) => {
    const keyPrefix = `${messageId}-${song.uri}-${index}`;

    return (
      <div
        key={keyPrefix}
        className="border rounded p-3 flex flex-row items-center gap-3"
      >
        <div className="w-[60px] h-[60px] flex items-center justify-center shrink-0">
          <Cover images={song.album.images} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate">
            <span className="text-gray-400">song:</span> {song.name}
          </div>
          <div className="truncate">
            <span className="text-gray-400">album:</span> {song.album.name}
          </div>
          <div className="truncate">
            <span className="text-gray-400">artist:</span>{" "}
            {song.artists[0]?.name}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="border rounded px-2 py-1"
            disabled={actionKey === `${keyPrefix}-play`}
            onClick={() =>
              void withAction(`${keyPrefix}-play`, async () =>
                await sendSpotifyAction({
                  endpoint: "/api/spotify/play",
                  uris: [song.uri],
                  actionName: "play",
                }))}
          >
            Play
          </button>
          <button
            type="button"
            className="border rounded px-2 py-1"
            disabled={actionKey === `${keyPrefix}-queue`}
            onClick={() =>
              void withAction(`${keyPrefix}-queue`, async () =>
                await sendSpotifyAction({
                  endpoint: "/api/spotify/queue",
                  uris: [song.uri],
                  actionName: "queue",
                }))}
          >
            Queue
          </button>
          <button
            type="button"
            className="border rounded px-2 py-1"
            onClick={() =>
              startPlaylistFlow([song.uri])}
          >
            Playlist
          </button>
          <button
            type="button"
            className="border rounded px-2 py-1"
            onClick={() =>
              globalThis.open(
                song.external_urls.spotify,
                "_blank",
                "noopener,noreferrer",
              )}
          >
            Spotify
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-4 flex flex-col md:flex-row gap-4">
      <aside className="w-full md:w-72 border rounded h-fit">
        <div className="p-3 border-b flex flex-row justify-between items-center">
          <div className="font-semibold">Conversations</div>
          <button
            type="button"
            className="border rounded px-2 py-1 flex flex-row gap-1 items-center"
            onClick={resetForNewChat}
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {threads.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No chats yet</div>
          )}
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={`w-full p-3 border-b text-left flex flex-row justify-between items-start gap-2 ${
                activeThreadId === thread.id
                  ? "bg-gray-100 dark:bg-gray-800"
                  : ""
              }`}
              onClick={() => void openThread(thread.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="truncate">{thread.title}</div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(thread.updated_at)}
                </div>
              </div>
              <Trash
                className="w-4 h-4 shrink-0"
                onClick={(event: JSX.TargetedMouseEvent<SVGElement>) => {
                  event.stopPropagation();
                  void deleteThread(thread.id);
                }}
              />
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 border rounded">
        <div className="p-3 border-b">
          <Devices
            tracks={hasSongs}
            devices={devices}
            setDevices={setDevices}
          />
        </div>

        <div className="p-3 min-h-[50vh] max-h-[60vh] overflow-y-auto flex flex-col gap-3">
          {loadingThread && (
            <div className="text-sm text-gray-500">Loading conversation...</div>
          )}

          {!messages.length && !loadingThread && (
            <div className="text-sm text-gray-500">
              Start a conversation and ask Luther what to play.
            </div>
          )}

          {messages.map((message) => (
            <div key={String(message.id)} className="flex flex-col gap-2">
              <div
                className={`rounded border p-3 ${
                  message.role === "user"
                    ? "self-end bg-gray-100 dark:bg-gray-800"
                    : "self-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="text-xs text-gray-500 mb-1 uppercase">
                    {submitting && message.content.length === 0
                      ? (
                        <span className="inline-flex items-center gap-0.5">
                          <span>Lutherizing</span>
                          <span className="animate-pulse">...</span>
                        </span>
                      )
                      : "Luther"}
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>

              {message.role === "assistant" &&
                (message.song_cards?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-2 border rounded p-3">
                  <div className="flex flex-row flex-wrap gap-2">
                    <button
                      type="button"
                      className="border rounded px-2 py-1"
                      disabled={actionKey === `${message.id}-play-all`}
                      onClick={() =>
                        void withAction(`${message.id}-play-all`, async () =>
                          await sendSpotifyAction({
                            endpoint: "/api/spotify/play",
                            uris: message.song_cards!.map((song) =>
                              song.uri
                            ),
                            actionName: "play",
                          }))}
                    >
                      Play All
                    </button>
                    <button
                      type="button"
                      className="border rounded px-2 py-1"
                      disabled={actionKey === `${message.id}-queue-all`}
                      onClick={() =>
                        void withAction(`${message.id}-queue-all`, async () =>
                          await sendSpotifyAction({
                            endpoint: "/api/spotify/queue",
                            uris: message.song_cards!.map((song) => song.uri),
                            actionName: "queue",
                          }))}
                    >
                      Queue All
                    </button>
                    <button
                      type="button"
                      className="border rounded px-2 py-1"
                      onClick={() =>
                        startPlaylistFlow(message.song_cards!.map((song) =>
                          song.uri
                        ))}
                    >
                      Playlist All
                    </button>
                    <button
                      type="button"
                      className="border rounded px-2 py-1"
                      onClick={() => startRemixFlow(message.id)}
                    >
                      Remix
                    </button>
                  </div>

                  {message.song_cards!.map((song, index) =>
                    renderSongCard(song, message.id, index)
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t flex flex-col gap-2">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <textarea
            rows={2}
            value={prompt}
            placeholder="What do you want to hear?"
            className="w-full"
            onInput={(event) => {
              const target = event.target as HTMLTextAreaElement;
              setPrompt(target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) {
                return;
              }

              event.preventDefault();
              void submit();
            }}
          />
          <div className="flex flex-row justify-end items-center gap-2">
            <button
              type="button"
              className="border rounded px-3 py-1"
              disabled={submitting || !prompt.trim()}
              onClick={() => void submit()}
            >
              {submitting ? "Thinking..." : "Send"}
            </button>
          </div>
        </div>
      </section>

      <Modal id={PLAYLIST_MODAL_ID} title="Add to Playlist">
        <PlaylistModal
          modalId={PLAYLIST_MODAL_ID}
          add={(playlistId, playlistName) => {
            const uris = [...pendingPlaylistUris];

            void withAction("playlist", async () =>
              await sendSpotifyAction({
                endpoint: "/api/spotify/playlist",
                uris,
                playlistId,
                playlistName,
                actionName: "playlist",
              }));
          }}
        />
      </Modal>
      <Modal id={REMIX_MODAL_ID} title="Remix These Songs">
        <form
          className="w-full flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const sourceMessageId = remixSourceMessageId;

            if (!sourceMessageId) {
              return;
            }

            (document.getElementById(REMIX_MODAL_ID) as HTMLDialogElement)
              ?.close();
            void submit({
              message: `Remix: ${
                remixPrompt.trim() ||
                "give me more songs in this lane combined with these"
              }`,
              remix: {
                sourceMessageId,
                prompt: remixPrompt.trim(),
              },
            });
          }}
        >
          <label className="text-sm font-semibold" for="remixPrompt">
            Optional remix prompt
          </label>
          <textarea
            id="remixPrompt"
            rows={3}
            value={remixPrompt}
            placeholder="ex: keep the same vibe but add more women artists and deeper cuts"
            onInput={(event) =>
              setRemixPrompt((event.target as HTMLTextAreaElement).value)}
          />
          <div className="flex flex-row justify-end items-center gap-2 w-full">
            <button
              type="button"
              className="border rounded px-3 py-1"
              onClick={() =>
                (document.getElementById(REMIX_MODAL_ID) as HTMLDialogElement)
                  ?.close()}
            >
              Cancel
            </button>
            <button type="submit" className="border rounded px-3 py-1">
              Remix
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
