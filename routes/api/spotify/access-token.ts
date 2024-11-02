import { Handlers } from "$fresh/server.ts";
import {
  SPOTIFY_AUTH,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_TOKEN_URL,
} from "@/lib/config.ts";
import { setCookie } from "@std/http/cookie";
import { setTokenCookie } from "@/lib/spotify.ts";

export const handler: Handlers = {
  async GET(_, ctx) {
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

    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: Date.now() + (token.expires_in * 1000),
    };

    const response = new Response("", {
      status: 307,
      headers: { Location: "/tracks" },
    });

    setTokenCookie(response.headers, tokenData);
    return response;
  },
};
