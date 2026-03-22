import { redirect } from "@/lib/utils.ts";
import {
  type Device,
  type Playlist,
  type Track,
} from "@spotify/web-api-ts-sdk";
import { SpotifyToken } from "./token.ts";

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export type TrackLite = Pick<Track, "name" | "uri" | "external_urls"> & {
  album: Pick<Track["album"], "name" | "images">;
  artists: { name: string }[];
};

export type RemixSeedSong = {
  name: string;
  artist: string;
  album: string;
};

type SpotifyAccessToken = {
  access_token: string;
};

const DEFAULT_MARKET = "US";
const DEFAULT_RETRIES = 2;
const SEARCH_LIMIT = 5;
const MAX_PLAYLIST_REMIX_SONGS = 80;

const pareTrack = (track: Track): TrackLite => {
  const {
    name,
    external_urls,
    album: { name: albumName, images },
    uri,
    artists,
  } = track;

  return {
    name,
    external_urls,
    album: { name: albumName, images },
    uri,
    artists: [{ name: artists[0]?.name }],
  };
};

const delay = async (ms: number) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

const retryAfterMs = (response: Response, attempt: number) => {
  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfterHeader
    ? Number.parseFloat(retryAfterHeader)
    : Number.NaN;
  const backoffMs = 250 * (2 ** attempt);

  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) {
    return backoffMs;
  }

  return Math.max(backoffMs, retryAfterSeconds * 1000);
};

const isRetryableStatus = (status: number) =>
  status === 429 || status === 500 || status === 502 || status === 503 ||
  status === 504;

const spotifyFetch = async (
  url: string,
  init: RequestInit,
  retries: number = DEFAULT_RETRIES,
) => {
  let attempt = 0;

  while (true) {
    const response = await fetch(url, init);

    if (!isRetryableStatus(response.status) || attempt >= retries) {
      return response;
    }

    await delay(retryAfterMs(response, attempt));
    attempt += 1;
  }
};

const normalize = (value: string | undefined | null) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const LIVE_VERSION_PATTERN = /\blive\b|\bunplugged\b|\bconcert\b/;

const includesLiveMarker = (value: string | undefined | null) =>
  LIVE_VERSION_PATTERN.test(normalize(value));

const isLiveRequest = (
  { song, album }: { song: string; album?: string },
) => includesLiveMarker(song) || includesLiveMarker(album);

const isLikelyLiveTrack = (track: Track) =>
  includesLiveMarker(track.name) || includesLiveMarker(track.album?.name);

const matchScore = (
  track: Track,
  {
    song,
    artist,
    album,
    prefersLiveVersion,
  }: {
    song: string;
    artist: string;
    album?: string;
    prefersLiveVersion: boolean;
  },
) => {
  const normalizedSong = normalize(song);
  const normalizedArtist = normalize(artist);
  const normalizedAlbum = normalize(album);
  const trackName = normalize(track.name);
  const albumName = normalize(track.album?.name);
  const artistNames = track.artists.map((entry) => normalize(entry.name));
  const hasArtistExact = artistNames.some((name) => name === normalizedArtist);
  const hasArtistPartial = artistNames.some((name) =>
    normalizedArtist.includes(name) || name.includes(normalizedArtist)
  );

  const songScore = trackName === normalizedSong
    ? 5
    : trackName.includes(normalizedSong) || normalizedSong.includes(trackName)
    ? 3
    : 0;
  const artistScore = hasArtistExact ? 5 : hasArtistPartial ? 3 : 0;
  const albumScore = !normalizedAlbum
    ? 0
    : albumName === normalizedAlbum
    ? 3
    : albumName.includes(normalizedAlbum) || normalizedAlbum.includes(albumName)
    ? 1
    : 0;
  const livePenalty = !prefersLiveVersion && isLikelyLiveTrack(track) ? -4 : 0;

  return songScore + artistScore + albumScore + livePenalty;
};

export const searchSong = async (
  token: SpotifyAccessToken,
  {
    song,
    artist,
    album,
    market = DEFAULT_MARKET,
  }: {
    song: string;
    album?: string;
    artist: string;
    market?: string;
  },
): Promise<TrackLite | null> => {
  if (!song || !artist) {
    return null;
  }

  const query = encodeURIComponent(
    [
      `track:${song}`,
      `artist:${artist}`,
    ].filter(Boolean).join(" "),
  );

  const searchQuery =
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=${SEARCH_LIMIT}&market=${market}`;

  const response = await spotifyFetch(
    searchQuery,
    {
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
      },
    },
  );

  if (!response.ok) {
    console.error("error searching for song", response);
    throw new Error("There was an error searching Spotify for a song!");
  }

  const result = await response.json();

  const tracks = Array.isArray(result?.tracks?.items)
    ? result.tracks.items as Track[]
    : [];

  if (!tracks.length) {
    return null;
  }

  const prefersLiveVersion = isLiveRequest({ song, album });
  const ranked = [...tracks]
    .map((track) => ({
      track,
      score: matchScore(track, { song, artist, album, prefersLiveVersion }),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.track ?? tracks[0];
  return best ? pareTrack(best) : null;
};

export const getDevices = async (token: SpotifyToken): Promise<Device[]> => {
  const response = await spotifyFetch(
    "https://api.spotify.com/v1/me/player/devices",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    console.error("error getting devices", response);
    throw new Error("There was an error getting your devices!");
  }

  const { devices } = await response.json();
  return devices || [];
};

export const getPlaylists = async (
  token: SpotifyToken,
): Promise<Playlist[]> => {
  const response = await spotifyFetch(
    "https://api.spotify.com/v1/me/playlists?limit=50",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    console.error("error getting playlists", response);
    throw new Error("There was an error getting your playlists!");
  }

  const { items } = await response.json();
  return items || [];
};

export const getPlaylistRemixSongs = async (
  token: SpotifyToken,
  playlistId: string,
  maxSongs: number = MAX_PLAYLIST_REMIX_SONGS,
): Promise<RemixSeedSong[]> => {
  if (!playlistId) {
    return [];
  }

  const seen = new Set<string>();
  const songs: RemixSeedSong[] = [];
  let next:
    | string
    | null = `https://api.spotify.com/v1/playlists/${
      encodeURIComponent(playlistId)
    }/tracks?limit=100&market=${DEFAULT_MARKET}`;

  while (next && songs.length < maxSongs) {
    const response = await spotifyFetch(
      next,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error("error getting playlist tracks", response);
      throw new Error("There was an error getting playlist tracks!");
    }

    const result = await response.json() as {
      items?: Array<{ track?: Track | null }>;
      next?: string | null;
    };
    const items = Array.isArray(result.items) ? result.items : [];

    for (const item of items) {
      const track = item.track;

      if (!track || track.type !== "track") {
        continue;
      }

      const name = track.name?.trim() ?? "";
      const artist = track.artists?.[0]?.name?.trim() ?? "";
      const album = track.album?.name?.trim() ?? "";

      if (!name || !artist || !album) {
        continue;
      }

      const key = `${normalize(name)}::${normalize(artist)}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      songs.push({ name, artist, album });

      if (songs.length >= maxSongs) {
        break;
      }
    }

    next = result.next ?? null;
  }

  return songs;
};

export const queue = async (
  token: SpotifyToken,
  deviceId: string,
  uris: string[],
) => {
  for await (const uri of uris) {
    //
    // sdk operation for this is busted, resort to fetch api
    // https://github.com/spotify/web-api-ts-sdk/issues/101
    const response = await spotifyFetch(
      `https://api.spotify.com/v1/me/player/queue?device_id=${deviceId}&uri=${uri}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error("error queueing spotify track", response);
      throw new Error("There was an error queueing your tracks!");
    }
  }
};

export const play = async (
  token: SpotifyToken,
  deviceId: string,
  uris: string[],
) => {
  const response = await spotifyFetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris,
        offset: { uri: uris[0] },
      }),
    },
  );

  if (!response.ok) {
    console.error("error starting spotify playback", response);
    throw new Error("There was an error starting playback!");
  }
};

export const createPlaylist = async (
  token: SpotifyToken,
  playlistName?: string,
) => {
  const playlistResponse = await spotifyFetch(
    "https://api.spotify.com/v1/me/playlists",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        public: false,
      }),
    },
  );

  if (!playlistResponse.ok) {
    console.error("error creating playlist", playlistResponse);
    throw new Error("There was an error creating your playlist!");
  }

  return await playlistResponse.json();
};

export const upsertPlaylist = async (
  token: SpotifyToken,
  uris: string[],
  playlistId?: string,
  playlistName?: string,
) => {
  if (!playlistId) {
    const { id } = await createPlaylist(token, playlistName);
    return await addToPlaylist(token, uris, id);
  }

  return await addToPlaylist(token, uris, playlistId);
};

export const addToPlaylist = async (
  token: SpotifyToken,
  uris: string[],
  playlistId: string,
) => {
  const response = await spotifyFetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/items`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris,
      }),
    },
  );

  if (!response.ok) {
    console.error("error adding tracks to playlist", response);
    throw new Error("There was an error updating your playlist!");
  }
};
