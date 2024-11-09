import { type Device, SpotifyApi, type Track } from "@spotify/web-api-ts-sdk";
import { signal } from "@preact/signals";
import { redirect } from "@/lib/utils.ts";

export const spotifySDK = signal<SpotifyApi | null>(null);

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export const spotifyAuthenticated = async () => {
  try {
    const user = await spotifySDK.value?.currentUser.profile();
    return user !== undefined;
  } catch (e) {
    console.warn("user not authenticated with spotify", e);
    return false;
  }
};

export const searchSong = async (
  { song, artist }: { song: string; album: string; artist: string },
): Promise<Track> => {
  if (!spotifySDK.value) {
    throw new Error("spotify sdk not initialized");
  }

  const query = `track:"${song}" artist:"${artist}"`;
  const result = await spotifySDK.value?.search(query, ["track"], undefined, 1);

  return result.tracks.items[0];
};

export const getDevices = async (): Promise<Device[]> => {
  const resuit = await spotifySDK.value?.player.getAvailableDevices();
  return resuit?.devices ? resuit.devices : [];
};

export const queue = async (
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
          "Authorization": `Bearer ${spotifySDK.value?.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const play = async (
  deviceId: string,
  uris: string[],
) =>
  await spotifySDK.value?.player.startResumePlayback(deviceId, undefined, uris);

export const searchSongs = async (
  songs: { song: string; album: string; artist: string }[],
): Promise<Track[]> => {
  const spotifyTracks = await Promise.all(
    songs.map(async (song) => await searchSong(song)),
  );

  return spotifyTracks;
};
