import { define } from "@/lib/state.ts";

import { getDevices, play, spotifyToken } from "@/lib/spotify.ts";
import { getCookies } from "@std/http/cookie";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const device = form.get("device")?.toString();
    const uris = form.getAll("trackURI");

    if (!device || uris.length === 0) {
      throw Error("missing device or track uri");
    }

    const rawToken = getCookies(ctx.req.headers).spotifyToken;
    const token = await spotifyToken(ctx.url.origin, rawToken);
    await play(token, device, uris.map((uri) => uri.toString()));

    return new Response(null, { status: 200 });
  },
});
