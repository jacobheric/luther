import { define } from "@/lib/state.ts";

import { getDevices, spotifyToken } from "@/lib/spotify.ts";
import { getCookies } from "@std/http/cookie";

export const handler = define.handlers({
  async GET(ctx) {
    const rawToken = getCookies(ctx.req.headers).spotifyToken;
    const token = await spotifyToken(ctx.url.origin, rawToken);
    const devices = await getDevices(token);

    return new Response(JSON.stringify(devices));
  },
});
