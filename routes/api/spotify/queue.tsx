import { define } from "@/lib/state.ts";

import { getDevices, play, queue, spotifyToken } from "@/lib/spotify.ts";
import { getCookies } from "@std/http/cookie";
import { getSpotifyToken } from "@/lib/token.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const device = form.get("device")?.toString();
    const uris = form.getAll("trackURI");

    if (!device || uris.length === 0) {
      throw Error("missing device or track uri");
    }

    const token = await getSpotifyToken(ctx);
    await queue(token, device, uris.map((uri) => uri.toString()));

    return new Response(null, { status: 200 });
  },
});