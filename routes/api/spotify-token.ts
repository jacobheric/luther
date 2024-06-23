import { Handlers } from "$fresh/server.ts";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "../../lib/config.ts";
import { setCookie } from "$std/http/cookie.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

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
    body.append("redirect_uri", "http://localhost:8000/api/spotify-token");
    const auth = encodeBase64(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

    const apiResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
      },
      body,
    });

    const token = await apiResponse.json();

    if (!token) {
      throw new Error("could not get spotify token");
    }

    const response = new Response("", {
      status: 307,
      headers: { Location: "/tracks" },
    });

    setCookie(response.headers, {
      name: "spotifyToken",
      path: "/",
      value: encodeURIComponent(JSON.stringify(token)),
      maxAge: 400 * 24 * 60 * 60,
    });
    return response;
  },
};
