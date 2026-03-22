import { useEffect, useState } from "preact/hooks";
import Music from "tabler-icons/tsx/music.tsx";
import Heart from "tabler-icons/tsx/heart.tsx";
import HeartFilled from "tabler-icons/tsx/heart-filled.tsx";

type NowPlayingTrack = {
  name: string;
  uri: string;
  artists: { name: string }[];
  external_urls: { spotify: string };
  album: { name: string; images?: Array<{ url?: string }> };
};

type NowPlayingState = {
  isPlaying: boolean;
  track: NowPlayingTrack | null;
  isSaved: boolean;
};

const POLL_INTERVAL_MS = 10_000;

export const NowPlaying = ({ pathname }: { pathname: string }) => {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingState | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchNowPlaying = async () => {
    const response = await fetch("/api/spotify/now-playing");

    if (!response.ok) {
      setNowPlaying(null);
      return;
    }

    const payload = await response.json() as NowPlayingState;

    if (!payload.isPlaying || !payload.track) {
      setNowPlaying(null);
      return;
    }

    setNowPlaying(payload);
  };

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    let isActive = true;

    const poll = async () => {
      if (!isActive) {
        return;
      }

      await fetchNowPlaying().catch(() => {
        setNowPlaying(null);
      });
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      isActive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  if (pathname !== "/" || !nowPlaying?.track) {
    return <div className="w-full" />;
  }

  const track = nowPlaying.track;
  const imageUrl = track.album?.images?.[0]?.url ?? "";
  const artistLabel = track.artists.map((artist) => artist.name).join(", ");

  const like = async () => {
    if (saving || nowPlaying.isSaved) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/spotify/library", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ uri: track.uri }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          globalThis.location.href = "/spotify/login";
        }
        return;
      }

      setNowPlaying((current) =>
        current ? { ...current, isSaved: true } : null
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 flex items-center justify-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
      {imageUrl
        ? (
          <img
            src={imageUrl}
            alt=""
            className="w-6 h-6 rounded object-cover"
          />
        )
        : <Music className="w-4 h-4 shrink-0 opacity-70" />}
      <a
        href={track.external_urls.spotify}
        target="_blank"
        rel="noreferrer noopener"
        className="no-underline min-w-0 max-w-[28rem]"
      >
        <div className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
          {track.name}
        </div>
        <div className="truncate text-[11px] opacity-75">
          {artistLabel}
        </div>
      </a>
      <button
        type="button"
        className="cursor-pointer !p-0 h-6 w-6 inline-flex items-center justify-center !border-0 !bg-transparent !rounded-none text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => void like()}
        disabled={saving || nowPlaying.isSaved}
        title={nowPlaying.isSaved ? "Saved to library" : "Save to library"}
        aria-label={nowPlaying.isSaved ? "Saved to library" : "Save to library"}
      >
        {nowPlaying.isSaved
          ? <HeartFilled className="w-4 h-4 text-emerald-500" />
          : <Heart className="w-4 h-4" />}
      </button>
    </div>
  );
};
