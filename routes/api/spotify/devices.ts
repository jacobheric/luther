import { define } from "@/lib/state.ts";

import { getSpotifyToken } from "@/lib/token.ts";
import { getDevices } from "@/lib/spotify.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const token = await getSpotifyToken(ctx);
    const devices = await getDevices(token);

    return new Response(JSON.stringify(devices));
  },
});
