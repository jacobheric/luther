import { Modal } from "@/islands/modal.tsx";
import { PlaylistModal } from "@/islands/playlist.tsx";
import { Devices } from "@/islands/devices.tsx";
import Tooltip from "@/islands/tooltip.tsx";
import type {
  ChatMessage,
  ChatStreamEvent,
  ChatThread,
} from "@/lib/chat/types.ts";
import type { TrackLite } from "@/lib/spotify/api.ts";
import type { Device } from "@spotify/web-api-ts-sdk";
import { Cover } from "@/islands/cover.tsx";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import Trash from "tabler-icons/tsx/trash.tsx";
import Plus from "tabler-icons/tsx/plus.tsx";
import PlayerPlay from "tabler-icons/tsx/player-play.tsx";
import PlayerTrackNext from "tabler-icons/tsx/player-track-next.tsx";
import PlaylistAdd from "tabler-icons/tsx/playlist-add.tsx";
import BrandSpotify from "tabler-icons/tsx/brand-spotify.tsx";
import ArrowsShuffle from "tabler-icons/tsx/arrows-shuffle.tsx";
import Messages from "tabler-icons/tsx/messages.tsx";
import DeviceSpeaker from "tabler-icons/tsx/device-speaker.tsx";
import X from "tabler-icons/tsx/x.tsx";
import Edit from "tabler-icons/tsx/edit.tsx";
import Playlist from "tabler-icons/tsx/playlist.tsx";

type MessageView = Omit<ChatMessage, "id"> & {
  id: number | string;
};

type RemixSeedSong = {
  name: string;
  artist: string;
  album: string;
};

type PlaylistSummary = {
  id: string;
  name: string;
  tracksTotal: number;
};

type PlaylistRemixSource = {
  playlistName: string;
  songs: RemixSeedSong[];
};

type MessageMetrics = {
  count: number;
  contentChars: number;
  songCards: number;
  threadId: number | null;
};

const PLAYLIST_MODAL_ID = "chat-add-to-playlist";
const REMIX_MODAL_ID = "chat-remix";

const nowIso = () => new Date().toISOString();
const currentPath = () =>
  `${globalThis.location.pathname}${globalThis.location.search}` || "/";
const loginRedirectPath = () =>
  `/login/callback?redirect=${encodeURIComponent(currentPath())}`;
const spotifyLoginPath = "/spotify/login";
const iconButtonClass =
  "cursor-pointer !p-0 h-7 w-7 inline-flex items-center justify-center !border-0 !bg-transparent !rounded-none text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed";
const iconClass = "w-4 h-4 shrink-0";

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

const toMessageMetrics = (
  messages: MessageView[],
  threadId: number | null,
): MessageMetrics => ({
  count: messages.length,
  contentChars: messages.reduce(
    (total, message) => total + message.content.length,
    0,
  ),
  songCards: messages.reduce(
    (total, message) => total + (message.song_cards?.length ?? 0),
    0,
  ),
  threadId,
});

const toPlaylistSummary = (value: unknown): PlaylistSummary | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const playlist = value as {
    id?: unknown;
    name?: unknown;
    tracks?: { total?: unknown };
  };
  const id = typeof playlist.id === "string" ? playlist.id.trim() : "";
  const name = typeof playlist.name === "string" ? playlist.name.trim() : "";

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    tracksTotal: typeof playlist.tracks?.total === "number"
      ? playlist.tracks.total
      : 0,
  };
};

type NavPanel = "threads" | "devices" | "playlists";

export const Chat = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesLoaded, setDevicesLoaded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPlaylistUris, setPendingPlaylistUris] = useState<string[]>([]);
  const [remixSourceMessageId, setRemixSourceMessageId] = useState<
    number | null
  >(null);
  const [playlistRemixSource, setPlaylistRemixSource] = useState<
    PlaylistRemixSource | null
  >(null);
  const [remixPrompt, setRemixPrompt] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navOverlayOpen, setNavOverlayOpen] = useState(false);
  const [navPanel, setNavPanel] = useState<NavPanel>("threads");
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistRemixId, setPlaylistRemixId] = useState<string | null>(null);
  const authRedirecting = useRef(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageMetricsRef = useRef<MessageMetrics>({
    count: 0,
    contentChars: 0,
    songCards: 0,
    threadId: null,
  });

  const hasSongs = useMemo(
    () =>
      messages.some((message) =>
        message.role === "assistant" && (message.song_cards?.length ?? 0) > 0
      ),
    [messages],
  );
  const hasSelectedDevice = useMemo(
    () => devices.some((device) => device.id === selectedDeviceId),
    [devices, selectedDeviceId],
  );
  const deviceQuickButtonClass = `${iconButtonClass} ${
    hasSelectedDevice
      ? "!text-emerald-600 hover:!text-emerald-500 dark:!text-emerald-400 dark:hover:!text-emerald-300"
      : devicesLoaded
      ? "!text-rose-600 hover:!text-rose-500 dark:!text-rose-400 dark:hover:!text-rose-300"
      : ""
  }`;

  const closeNavOverlay = () => setNavOverlayOpen(false);
  const updateAutoScrollIntent = () => {
    const container = messageListRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop -
      container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 96;
  };
  const scrollMessageListToBottom = (behavior: ScrollBehavior = "auto") => {
    const container = messageListRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };
  const filteredPlaylists = useMemo(() => {
    const query = playlistQuery.trim().toLowerCase();

    if (!query) {
      return playlists;
    }

    return playlists.filter((playlist) =>
      playlist.name.toLowerCase().includes(query)
    );
  }, [playlistQuery, playlists]);

  const onAuthRequired = () => {
    if (authRedirecting.current) {
      return;
    }

    authRedirecting.current = true;
    setError("Session expired. Redirecting to login...");
    globalThis.location.href = loginRedirectPath();
  };

  const onSpotifyAuthRequired = () => {
    if (authRedirecting.current) {
      return;
    }

    authRedirecting.current = true;
    setError("Spotify authorization required. Redirecting...");
    globalThis.location.href = spotifyLoginPath;
  };

  const fetchWithSessionRecovery = async (
    input: string,
    init?: RequestInit,
  ) => await fetch(input, init);

  const requireOk = (response: Response, message: string) => {
    const errorCode = response.headers.get("x-luther-error-code");

    if (errorCode === "spotify-auth-required") {
      onSpotifyAuthRequired();
      throw new Error("spotify authorization required");
    }

    if (response.status === 401 || errorCode === "auth-required") {
      onAuthRequired();
      throw new Error("authentication required");
    }

    if (!response.ok) {
      throw new Error(message);
    }
  };

  const fetchThreads = async () => {
    const response = await fetchWithSessionRecovery("/api/chat/threads");

    requireOk(response, "failed to load threads");

    const nextThreads = await response.json() as ChatThread[];
    setThreads(nextThreads);

    return nextThreads;
  };

  const fetchMessages = async (threadId: number) => {
    setLoadingThread(true);

    try {
      const response = await fetchWithSessionRecovery(
        `/api/chat/threads/${threadId}/messages`,
      );
      requireOk(response, "failed to load messages");

      const nextMessages = await response.json() as ChatMessage[];
      setMessages(nextMessages.map(toMessageView));
      shouldAutoScrollRef.current = true;
    } catch (error) {
      console.error("failed to fetch thread messages", error);
      if (!authRedirecting.current) {
        setError("Could not load chat messages. Please refresh.");
      }
    } finally {
      setLoadingThread(false);
    }
  };

  const openThread = async (threadId: number) => {
    closeNavOverlay();
    shouldAutoScrollRef.current = true;
    setActiveThreadId(threadId);
    setError(null);
    await fetchMessages(threadId);
  };

  const pickPreferredDeviceId = (candidateDevices: Device[]) =>
    candidateDevices.find((device) => Boolean(device.is_active && device.id))
      ?.id ??
      candidateDevices.find((device) => Boolean(device.id))?.id ??
      "";

  const fetchDevices = async (silent = false): Promise<Device[]> => {
    if (loadingDevices) {
      return devices;
    }

    setLoadingDevices(true);

    try {
      const response = await fetchWithSessionRecovery("/api/spotify/devices");
      requireOk(response, "failed to load devices");

      const nextDevices = await response.json() as Device[];
      setDevices(nextDevices);
      setDevicesLoaded(true);
      return nextDevices;
    } catch (error) {
      console.error("failed to fetch devices", error);
      setDevices([]);
      setDevicesLoaded(true);

      if (!silent && !authRedirecting.current) {
        setError("Could not load Spotify devices.");
      }

      return [];
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchPlaylists = async (force = false) => {
    if (loadingPlaylists) {
      return;
    }

    if (playlists.length && !force) {
      return;
    }

    setLoadingPlaylists(true);

    try {
      const response = await fetchWithSessionRecovery("/api/spotify/playlists");
      requireOk(response, "failed to load playlists");

      const rawPlaylists = await response.json() as unknown[];
      const nextPlaylists = rawPlaylists
        .map(toPlaylistSummary)
        .filter((playlist): playlist is PlaylistSummary => playlist !== null);
      setPlaylists(nextPlaylists);
    } catch (error) {
      console.error("failed to fetch playlists", error);
      if (!authRedirecting.current) {
        setError("Could not load playlists.");
      }
    } finally {
      setLoadingPlaylists(false);
    }
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
        if (!authRedirecting.current) {
          setError("Could not load your chat history. Please refresh.");
        }
      }
    })();
  }, []);

  useEffect(() => {
    const handleOpenPanel = (event: Event) => {
      const detail = (event as CustomEvent<{ panel?: string }>).detail;
      const panel = detail?.panel;

      if (
        panel !== "threads" && panel !== "devices" && panel !== "playlists"
      ) {
        return;
      }

      setNavPanel(panel);
      setNavOverlayOpen(true);
    };

    globalThis.addEventListener(
      "luther:open-nav-panel",
      handleOpenPanel as EventListener,
    );

    return () => {
      globalThis.removeEventListener(
        "luther:open-nav-panel",
        handleOpenPanel as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!navOverlayOpen || navPanel !== "playlists") {
      return;
    }

    void fetchPlaylists();
  }, [navOverlayOpen, navPanel]);

  useEffect(() => {
    if (!hasSongs || devicesLoaded || loadingDevices) {
      return;
    }

    void fetchDevices(true);
  }, [hasSongs, devicesLoaded, loadingDevices]);

  useEffect(() => {
    const metrics = toMessageMetrics(messages, activeThreadId);
    const previousMetrics = previousMessageMetricsRef.current;
    previousMessageMetricsRef.current = metrics;

    const threadChanged = metrics.threadId !== previousMetrics.threadId;
    const isNewMessage = metrics.count > previousMetrics.count;
    const hasTextChange = metrics.contentChars !== previousMetrics.contentChars;
    const hasOnlySongCardChange =
      metrics.songCards !== previousMetrics.songCards &&
      !isNewMessage &&
      !hasTextChange;

    if (hasOnlySongCardChange) {
      return;
    }

    if (!shouldAutoScrollRef.current && !isNewMessage && !threadChanged) {
      return;
    }

    scrollMessageListToBottom(isNewMessage ? "smooth" : "auto");
  }, [messages, activeThreadId]);

  useEffect(() => {
    if (!devices.length) {
      setSelectedDeviceId("");
      return;
    }

    if (
      selectedDeviceId &&
      devices.some((device) => device.id === selectedDeviceId)
    ) {
      return;
    }

    setSelectedDeviceId(pickPreferredDeviceId(devices));
  }, [devices, selectedDeviceId]);

  const resetForNewChat = () => {
    closeNavOverlay();
    setActiveThreadId(null);
    setMessages([]);
    setPrompt("");
    setError(null);
  };

  const openDevicesPanel = () => {
    setNavPanel("devices");
    setNavOverlayOpen(true);
    void fetchDevices();
  };

  const remixFromPlaylist = async (playlist: PlaylistSummary) => {
    setPlaylistRemixId(playlist.id);
    setError(null);

    try {
      const response = await fetchWithSessionRecovery(
        `/api/spotify/playlists/${encodeURIComponent(playlist.id)}/tracks`,
      );
      requireOk(response, "failed to load playlist tracks");

      const body = await response.json() as { songs?: RemixSeedSong[] };
      const songs = Array.isArray(body.songs) ? body.songs : [];

      if (!songs.length) {
        setError("No remixable songs found in that playlist.");
        return;
      }

      setRemixSourceMessageId(null);
      setPlaylistRemixSource({
        playlistName: playlist.name,
        songs,
      });
      setRemixPrompt("");
      closeNavOverlay();
      (document.getElementById(REMIX_MODAL_ID) as HTMLDialogElement)
        ?.showModal();
    } catch (error) {
      console.error("playlist remix failed", error);
      if (!authRedirecting.current) {
        setError("Playlist remix failed. Please try again.");
      }
    } finally {
      setPlaylistRemixId(null);
    }
  };

  const withAction = async (key: string, action: () => Promise<void>) => {
    setActionKey(key);
    setError(null);

    try {
      await action();
    } catch (error) {
      console.error("spotify action failed", error);
      if (!authRedirecting.current) {
        setError("Spotify action failed. Please try again.");
      }
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
      let deviceId = selectedDeviceId;

      if (!deviceId || !devices.some((device) => device.id === deviceId)) {
        const refreshedDevices = await fetchDevices(true);
        deviceId = pickPreferredDeviceId(refreshedDevices);

        if (deviceId) {
          setSelectedDeviceId(deviceId);
        }
      }

      if (!deviceId) {
        setError(
          "No Spotify device available. Open Spotify on your phone/computer and pick it in Devices.",
        );
        setNavPanel("devices");
        setNavOverlayOpen(true);
        return;
      }

      const formData = new FormData();
      formData.append("device", deviceId);
      uris.forEach((uri) => formData.append("trackURI", uri));

      const response = await fetchWithSessionRecovery(endpoint, {
        method: "POST",
        body: formData,
      });

      requireOk(response, `spotify ${actionName} failed`);

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

    const response = await fetchWithSessionRecovery(endpoint, {
      method: "POST",
      body: formData,
    });

    requireOk(response, `spotify ${actionName} failed`);
  };

  const submit = async (
    {
      message,
      remix,
    }: {
      message?: string;
      remix?: {
        sourceMessageId?: number;
        prompt?: string;
        songs?: RemixSeedSong[];
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
    shouldAutoScrollRef.current = true;
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
      const response = await fetchWithSessionRecovery("/api/chat/messages", {
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

      requireOk(response, "failed to stream chat");

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
      if (!authRedirecting.current) {
        setError("Chat failed. Please try again.");
      }
      setMessages((current) =>
        current.filter((message) => message.id !== tempAssistantId)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteThread = async (threadId: number) => {
    try {
      const response = await fetchWithSessionRecovery(
        `/api/chat/threads/${threadId}`,
        {
          method: "DELETE",
        },
      );

      requireOk(response, "failed to delete thread");

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
      if (!authRedirecting.current) {
        setError("Failed to delete chat thread.");
      }
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
    setPlaylistRemixSource(null);
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
        className="rounded-lg bg-gray-50/70 dark:bg-gray-800/40 p-2.5 flex flex-row items-center gap-3"
      >
        <div className="w-[60px] h-[60px] flex items-center justify-center shrink-0">
          <Cover images={song.album.images} />
        </div>
        <div className="flex-1 min-w-0 text-sm leading-tight">
          <div className="truncate font-medium">{song.name}</div>
          <div className="truncate text-xs text-gray-500">
            {song.artists[0]?.name} • {song.album.name}
          </div>
        </div>
        <div className="flex flex-row items-center gap-1 shrink-0">
          <Tooltip tooltip="Play now" className="top-9 right-0">
            <button
              type="button"
              className={iconButtonClass}
              disabled={actionKey === `${keyPrefix}-play`}
              onClick={() =>
                void withAction(`${keyPrefix}-play`, async () =>
                  await sendSpotifyAction({
                    endpoint: "/api/spotify/play",
                    uris: [song.uri],
                    actionName: "play",
                  }))}
            >
              <PlayerPlay className={iconClass} />
            </button>
          </Tooltip>
          <Tooltip tooltip="Queue" className="top-9 right-0">
            <button
              type="button"
              className={iconButtonClass}
              disabled={actionKey === `${keyPrefix}-queue`}
              onClick={() =>
                void withAction(`${keyPrefix}-queue`, async () =>
                  await sendSpotifyAction({
                    endpoint: "/api/spotify/queue",
                    uris: [song.uri],
                    actionName: "queue",
                  }))}
            >
              <PlayerTrackNext className={iconClass} />
            </button>
          </Tooltip>
          <Tooltip tooltip="Add to playlist" className="top-9 right-0">
            <button
              type="button"
              className={iconButtonClass}
              onClick={() =>
                startPlaylistFlow([song.uri])}
            >
              <PlaylistAdd className={iconClass} />
            </button>
          </Tooltip>
          <Tooltip tooltip="Open in Spotify" className="top-9 right-0">
            <button
              type="button"
              className={iconButtonClass}
              onClick={() =>
                globalThis.open(
                  song.external_urls.spotify,
                  "_blank",
                  "noopener,noreferrer",
                )}
            >
              <BrandSpotify className={iconClass} />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-full overflow-x-clip py-1 flex flex-col md:flex-row gap-2 md:gap-4 h-[calc(100dvh-4.5rem)] md:h-[calc(100vh-4.5rem)] min-h-0 md:min-h-[34rem]">
      {navOverlayOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[12000] !p-0 !rounded-none !border-0 !bg-black/30 cursor-pointer"
            onClick={closeNavOverlay}
          />
          <div className="fixed inset-0 z-[12010] p-3 sm:p-6 flex items-start sm:items-center justify-center pointer-events-none">
            <aside className="pointer-events-auto w-full max-w-2xl h-[min(82vh,44rem)] bg-white/95 dark:bg-gray-900/95 border border-gray-200/70 dark:border-gray-800 rounded-xl backdrop-blur-sm shadow-xl flex flex-col gap-2 p-2">
              <div className="flex flex-row items-center justify-between px-1 border-b border-gray-200/70 dark:border-gray-800 pb-2">
                <div className="flex flex-row items-center gap-1">
                  <Tooltip tooltip="Conversations" className="top-8 left-0">
                    <button
                      type="button"
                      className={`${iconButtonClass} ${
                        navPanel === "threads"
                          ? "text-gray-900 dark:text-gray-100"
                          : ""
                      }`}
                      onClick={() => setNavPanel("threads")}
                    >
                      <Messages className={iconClass} />
                    </button>
                  </Tooltip>
                  <Tooltip tooltip="Devices" className="top-8 left-0">
                    <button
                      type="button"
                      className={`${iconButtonClass} ${
                        navPanel === "devices"
                          ? "text-gray-900 dark:text-gray-100"
                          : ""
                      }`}
                      onClick={() => setNavPanel("devices")}
                    >
                      <DeviceSpeaker className={iconClass} />
                    </button>
                  </Tooltip>
                  <Tooltip tooltip="Playlists" className="top-8 left-0">
                    <button
                      type="button"
                      className={`${iconButtonClass} ${
                        navPanel === "playlists"
                          ? "text-gray-900 dark:text-gray-100"
                          : ""
                      }`}
                      onClick={() => setNavPanel("playlists")}
                    >
                      <Playlist className={iconClass} />
                    </button>
                  </Tooltip>
                </div>
                <div className="flex flex-row items-center gap-1">
                  {navPanel === "threads" && (
                    <Tooltip
                      tooltip="New conversation"
                      className="top-8 right-0"
                    >
                      <button
                        type="button"
                        className={iconButtonClass}
                        onClick={resetForNewChat}
                      >
                        <Plus className={iconClass} />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip tooltip="Close" className="top-8 right-0">
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={closeNavOverlay}
                    >
                      <X className={iconClass} />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {navPanel === "devices"
                ? hasSongs
                  ? (
                    <div className="px-1 py-2">
                      <Devices
                        tracks={hasSongs}
                        devices={devices}
                        loading={loadingDevices}
                        devicesLoaded={devicesLoaded}
                        onRefresh={async () => {
                          await fetchDevices();
                        }}
                        selectedDeviceId={selectedDeviceId}
                        onSelectDevice={setSelectedDeviceId}
                      />
                    </div>
                  )
                  : (
                    <div className="px-2 py-2 text-sm text-gray-500">
                      Ask for songs first to enable device controls.
                    </div>
                  )
                : navPanel === "playlists"
                ? (
                  <div className="px-1 py-2 min-h-0 h-full flex flex-col gap-2">
                    <input
                      type="text"
                      value={playlistQuery}
                      placeholder="Search playlists"
                      className="w-full p-2 text-sm"
                      onInput={(event) =>
                        setPlaylistQuery(
                          (event.target as HTMLInputElement).value,
                        )}
                    />
                    <div className="min-h-0 overflow-y-auto pr-1">
                      {loadingPlaylists && (
                        <div className="p-2 text-sm text-gray-500">
                          Loading playlists...
                        </div>
                      )}
                      {!loadingPlaylists && filteredPlaylists.length === 0 && (
                        <div className="p-2 text-sm text-gray-500">
                          No playlists found.
                        </div>
                      )}
                      {filteredPlaylists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className="w-full pl-2 pr-1 py-2 flex flex-row justify-between items-center gap-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm">
                              {playlist.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {playlist.tracksTotal} tracks
                            </div>
                          </div>
                          <Tooltip
                            tooltip="Remix playlist"
                            className="top-8 right-0"
                          >
                            <button
                              type="button"
                              className={iconButtonClass}
                              disabled={playlistRemixId === playlist.id}
                              onClick={() => void remixFromPlaylist(playlist)}
                            >
                              <ArrowsShuffle className={iconClass} />
                            </button>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                )
                : (
                  <div className="min-h-0 overflow-y-auto pr-1">
                    {threads.length === 0 && (
                      <div className="p-3 text-sm text-gray-500">
                        No chats yet
                      </div>
                    )}
                    {threads.map((thread) => (
                      <div
                        key={thread.id}
                        className={`w-full pl-2 pr-1 py-2 flex flex-row justify-between items-center gap-2 border-l ${
                          activeThreadId === thread.id
                            ? "border-gray-400 dark:border-gray-500"
                            : "border-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          className={`cursor-pointer !p-0 !border-0 !bg-transparent !rounded-none flex-1 min-w-0 text-left ${
                            activeThreadId === thread.id
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                          onClick={() => void openThread(thread.id)}
                        >
                          <div className="truncate text-sm">{thread.title}</div>
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(thread.updated_at)}
                          </div>
                        </button>
                        <button
                          type="button"
                          className={iconButtonClass}
                          onClick={(
                            event: JSX.TargetedMouseEvent<HTMLButtonElement>,
                          ) => {
                            event.stopPropagation();
                            void deleteThread(thread.id);
                          }}
                        >
                          <Trash className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </aside>
          </div>
        </>
      )}

      <div
        className="fixed z-[70] left-1 sm:left-2 top-14 sm:top-[3.75rem] flex flex-col gap-1"
        style={{
          left: "calc(env(safe-area-inset-left) + 0.25rem)",
          top: "calc(env(safe-area-inset-top) + 3.5rem + 0.25rem)",
        }}
      >
        <Tooltip tooltip="New conversation" className="top-8 left-0">
          <button
            type="button"
            className={iconButtonClass}
            onClick={resetForNewChat}
            aria-label="Start a new conversation"
          >
            <Edit className={iconClass} />
          </button>
        </Tooltip>
        <Tooltip tooltip="Devices" className="top-8 left-0">
          <button
            type="button"
            className={deviceQuickButtonClass}
            onClick={openDevicesPanel}
            aria-label="Open devices"
          >
            <DeviceSpeaker className={iconClass} />
          </button>
        </Tooltip>
      </div>

      <section className="relative z-20 flex-1 min-h-0 flex flex-col overflow-x-clip">
        <div
          ref={messageListRef}
          className="scrollbar-none p-2 flex-1 min-h-0 overflow-y-auto overflow-x-clip flex flex-col gap-4"
          onScroll={updateAutoScrollIntent}
        >
          {loadingThread && (
            <div className="text-sm text-gray-500">Loading conversation...</div>
          )}

          {messages.map((message) => (
            <div key={String(message.id)} className="flex flex-col gap-2">
              <div
                className={`${
                  message.role === "user"
                    ? "self-end max-w-[85%] bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2"
                    : "self-start max-w-[92%] px-1"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">
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
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>

              {message.role === "assistant" &&
                (message.song_cards?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                  <div className="flex flex-row flex-wrap gap-1.5">
                    <Tooltip tooltip="Play all now" className="top-9 left-0">
                      <button
                        type="button"
                        className={iconButtonClass}
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
                        <PlayerPlay className={iconClass} />
                      </button>
                    </Tooltip>
                    <Tooltip tooltip="Queue all" className="top-9 left-0">
                      <button
                        type="button"
                        className={iconButtonClass}
                        disabled={actionKey === `${message.id}-queue-all`}
                        onClick={() =>
                          void withAction(`${message.id}-queue-all`, async () =>
                            await sendSpotifyAction({
                              endpoint: "/api/spotify/queue",
                              uris: message.song_cards!.map((song) =>
                                song.uri
                              ),
                              actionName: "queue",
                            }))}
                      >
                        <PlayerTrackNext className={iconClass} />
                      </button>
                    </Tooltip>
                    <Tooltip
                      tooltip="Add all to playlist"
                      className="top-9 left-0"
                    >
                      <button
                        type="button"
                        className={iconButtonClass}
                        onClick={() =>
                          startPlaylistFlow(message.song_cards!.map((song) =>
                            song.uri
                          ))}
                      >
                        <PlaylistAdd className={iconClass} />
                      </button>
                    </Tooltip>
                    <Tooltip tooltip="Remix this set" className="top-9 right-0">
                      <button
                        type="button"
                        className={iconButtonClass}
                        onClick={() =>
                          startRemixFlow(message.id)}
                      >
                        <ArrowsShuffle className={iconClass} />
                      </button>
                    </Tooltip>
                  </div>

                  {message.song_cards!.map((song, index) =>
                    renderSongCard(song, message.id, index)
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 pt-1 pb-1 px-2 max-w-full overflow-x-clip bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex flex-col gap-2">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <textarea
            rows={2}
            value={prompt}
            placeholder="What do you want to hear?"
            className="w-full max-w-full p-2.5 text-base sm:text-sm resize-none leading-5"
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
      <Modal
        id={REMIX_MODAL_ID}
        title={playlistRemixSource ? "Remix Playlist" : "Remix These Songs"}
      >
        <form
          className="w-full flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const sourceMessageId = remixSourceMessageId;
            const playlistSource = playlistRemixSource;

            if (!sourceMessageId && !playlistSource) {
              return;
            }

            (document.getElementById(REMIX_MODAL_ID) as HTMLDialogElement)
              ?.close();
            const promptValue = remixPrompt.trim();
            setRemixSourceMessageId(null);
            setPlaylistRemixSource(null);
            setRemixPrompt("");

            if (sourceMessageId) {
              void submit({
                message: `Remix: ${
                  promptValue ||
                  "give me more songs in this lane combined with these"
                }`,
                remix: {
                  sourceMessageId,
                  prompt: promptValue,
                },
              });
              return;
            }

            if (!playlistSource) {
              return;
            }

            void submit({
              message: `Remix playlist "${playlistSource.playlistName}": ${
                promptValue ||
                "give me more songs in this lane combined with these"
              }`,
              remix: {
                prompt: promptValue,
                songs: playlistSource.songs,
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
              className="border rounded px-3 py-1 cursor-pointer"
              onClick={() => {
                setRemixSourceMessageId(null);
                setPlaylistRemixSource(null);
                setRemixPrompt("");
                (document.getElementById(REMIX_MODAL_ID) as HTMLDialogElement)
                  ?.close();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border rounded px-3 py-1 cursor-pointer"
            >
              Remix
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
