import { define } from "@/lib/state.ts";

import { getSpotifyToken } from "@/lib/token.ts";
import { getDevices } from "@/lib/spotify.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const token = await getSpotifyToken(ctx);

    if (!token) {
      return new Response("", {
        status: 307,
        headers: { Location: "/spotify/login" },
      });
    }
    const devices = await getDevices(token);

    return new Response(JSON.stringify(devices));
  },
});
