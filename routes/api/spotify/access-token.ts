import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "@/lib/config.ts";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

import { spotifyAuthenticated, spotifySDK } from "@/lib/spotify.ts";
import { define } from "@/lib/state.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error("Spotify client id or secret missing");
    }

    const token = await ctx.req.json();

    spotifySDK.value = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, token);

    if (!await spotifyAuthenticated()) {
      return new Response("Spotify Authorization Failed", {
        status: 401,
      });
    }

    return new Response("", {
      status: 200,
    });
  },
});
