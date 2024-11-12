import { SpotifyToken } from "./token.ts";
import { redirect } from "@/lib/utils.ts";
import { type Device, type Track } from "@spotify/web-api-ts-sdk";

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export const searchSong = async (
  token: SpotifyToken,
  { song, artist }: { song: string; album: string; artist: string },
): Promise<Track> => {
  const query = `track:"${encodeURIComponent(song)}" artist:"${
    encodeURIComponent(artist)
  }"`;

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

  const result = await response.json();

  const track = result?.tracks?.items[0];
  return track;
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
        uris: uris,
      }),
    },
  );

export const searchSongs = async (
  token: SpotifyToken,
  songs: { song: string; album: string; artist: string }[],
): Promise<Track[]> => {
  const spotifyTracks = await Promise.all(
    songs.map(async (song) => await searchSong(token, song)),
  );

  return spotifyTracks.filter((track: Track | undefined) => track);
};
