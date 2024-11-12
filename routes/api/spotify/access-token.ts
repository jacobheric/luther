import {
  SPOTIFY_AUTH,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_TOKEN_URL,
} from "@/lib/config.ts";

import { define } from "@/lib/state.ts";
import { setSpotifyToken } from "@/lib/spotify/token.ts";

export const handler = define.handlers({
  async GET(ctx) {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error("Spotify client id or secret missing");
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error("Spotify client id or secret missing");
    }

    const code = ctx.url.searchParams.get("code");

    if (!code) {
      throw new Error("Spotify authorization code missing");
    }

    const body = new URLSearchParams();
    body.append("code", code);
    body.append("grant_type", "authorization_code");
    body.append(
      "redirect_uri",
      `${ctx.url.origin}/api/spotify/access-token`,
    );

    const apiResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${SPOTIFY_AUTH}`,
      },
      body,
    });

    const token = await apiResponse.json();

    if (!token || !token.access_token) {
      throw new Error("Failed to get get spotify token");
    }

    const response = new Response("", {
      status: 307,
      headers: { Location: "/" },
    });

    setSpotifyToken(response.headers, {
      ...token,
      expires: Date.now() + (token.expires_in * 1000),
    });
    return response;
  },
});
