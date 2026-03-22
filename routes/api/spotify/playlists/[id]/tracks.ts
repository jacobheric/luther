import { getPlaylistRemixSongs } from "@/lib/spotify/api.ts";
import { define } from "@/lib/state.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const playlistId = ctx.params.id?.trim();

    if (!playlistId) {
      return new Response("playlist id is required", { status: 400 });
    }

    const songs = await getPlaylistRemixSongs(
      ctx.state.spotifyToken,
      playlistId,
    );

    return Response.json({ songs });
  },
});
