import { define } from "@/lib/state.ts";
import { upsertPlaylist } from "@/lib/spotify/api.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const uris = form.getAll("trackURI");
    const playlistId = form.get("playlistId")?.toString();
    const playlistName = form.get("playlistName")?.toString();

    if (uris.length === 0) {
      throw Error("tracka are required");
    }

    if (!playlistId && !playlistName) {
      throw Error("playlistId or playlistName is required");
    }

    await upsertPlaylist(
      ctx.state.spotifyToken,
      uris.map((uri) => uri.toString()),
      playlistId,
      playlistName,
    );

    return new Response(null, { status: 200 });
  },
});
