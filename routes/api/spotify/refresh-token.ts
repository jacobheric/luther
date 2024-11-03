import { SPOTIFY_AUTH, SPOTIFY_TOKEN_URL } from "@/lib/config.ts";

import { define } from "@/lib/state.ts";
import { setTokenCookie } from "@/lib/cookie.ts";

export const handler = define.handlers({
  async POST({ req }) {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return new Response("Spotify refresh token required", { status: 400 });
    }

    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", refresh_token);

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${SPOTIFY_AUTH}`,
      },
      body,
    });

    const newToken = await response.json();

    if (!newToken.access_token) {
      return new Response("Failed to refresh spotify token", { status: 401 });
    }

    const tokenData = {
      access_token: newToken.access_token,
      refresh_token: newToken.refresh_token || refresh_token,
      expires_at: Date.now() + (newToken.expires_in * 1000),
    };

    const apiResponse = new Response(JSON.stringify(tokenData), {
      headers: { "Content-Type": "application/json" },
    });

    setTokenCookie(apiResponse.headers, tokenData);
    return apiResponse;
  },
});
