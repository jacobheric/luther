const spotifyRedirectOverride = Deno.env.get("SPOTIFY_REDIRECT_URI");

const normalizeLoopbackOrigin = (url: URL) => {
  if (url.hostname !== "localhost") {
    return url.origin;
  }

  //
  // Spotify no longer accepts localhost redirect URIs. Loopback IPs like
  // 127.0.0.1 are still allowed for local development.
  const normalizedUrl = new URL(url.toString());
  normalizedUrl.hostname = "127.0.0.1";

  return normalizedUrl.origin;
};

export const getSpotifyRedirectUri = (url: URL) =>
  spotifyRedirectOverride ??
    `${normalizeLoopbackOrigin(url)}/api/spotify/access-token`;
