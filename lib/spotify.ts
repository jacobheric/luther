export type TokenData = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export const spotifyToken = async (origin: string, rawToken: string) => {
  const token = JSON.parse(
    decodeURIComponent(rawToken),
  );

  if (!token.expires_at || Date.now() >= token.expires_at) {
    const response = await fetch(
      `${origin}/api/spotify/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: token.refresh_token }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return await response.json();
  }

  return token;
};

export const searchSong = async (
  token: TokenData,
  { song, artist }: { song: string; album: string; artist: string },
) => {
  const query = `track:"${encodeURIComponent(song)}" artist:"${
    encodeURIComponent(artist)
  }"`;

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
    {
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
      },
    },
  );
  const result = await response.json();
  const track = result.tracks.items[0];
  return track;
};

export const getDevices = async (token: TokenData) => {
  const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
  });

  const { devices } = await response.json();
  return devices;
};

export const play = async (
  token: TokenData,
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
  token: TokenData,
  songs: { song: string; album: string; artist: string }[],
) => {
  const spotifyTracks = await Promise.all(
    songs.map(async (song) => await searchSong(token, song)),
  );

  return spotifyTracks;
};
