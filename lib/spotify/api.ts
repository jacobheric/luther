import { redirect } from "@/lib/utils.ts";
import {
  type Device,
  type Playlist,
  type Track,
  type User,
} from "@spotify/web-api-ts-sdk";
import { SpotifyToken } from "./token.ts";

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export type TrackLite = Pick<Track, "name" | "uri"> & {
  album: Pick<Track["album"], "name" | "images">;
  artists: { name: string }[];
};

const pareTrack = (track: Track): TrackLite => {
  const {
    name,
    album: { name: albumName, images },
    uri,
    artists,
  } = track;

  return {
    name,
    album: { name: albumName, images },
    uri,
    artists: [{ name: artists[0]?.name }],
  };
};

export const searchSong = async (
  token: SpotifyToken,
  { song, artist }: { song: string; album: string; artist: string },
): Promise<TrackLite | null> => {
  if (!song || !artist) {
    return null;
  }
  const query = encodeURIComponent(`track:${song} artist:${artist}`);

  const searchQuery =
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;

  const response = await fetch(
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

  const track = result?.tracks?.items[0];
  return track ? pareTrack(track) : null;
};

export const getDevices = async (token: SpotifyToken): Promise<Device[]> => {
  const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
  });

  const { devices } = await response.json();
  return devices || [];
};

export const getPlaylists = async (
  token: SpotifyToken,
): Promise<Playlist[]> => {
  const response = await fetch(
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

export const queue = async (
  token: SpotifyToken,
  deviceId: string,
  uris: string[],
) => {
  for await (const uri of uris) {
    //
    // sdk operation for this is busted, resort to fetch api
    // https://github.com/spotify/web-api-ts-sdk/issues/101
    await fetch(
      `https://api.spotify.com/v1/me/player/queue?device_id=${deviceId}&uri=${uri}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const play = async (
  token: SpotifyToken,
  deviceId: string,
  uris: string[],
) =>
  await fetch(
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

export const createPlaylist = async (
  token: SpotifyToken,
  playlistName?: string,
) => {
  const userResponse = await fetch(
    `https://api.spotify.com/v1/me`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!userResponse.ok) {
    console.error("error creating playlist, couldn't get user", userResponse);
    throw new Error("There was an error creating your playlist!");
  }

  const user: User = await userResponse.json();

  const playlistResponse = await fetch(
    `https://api.spotify.com/v1/users/${user.id}/playlists`,
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
) =>
  await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: uris,
      }),
    },
  );
