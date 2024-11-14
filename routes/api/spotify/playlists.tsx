import { getPlaylists } from "@/lib/spotify/api.ts";
import { define } from "@/lib/state.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const playlists = await getPlaylists(ctx.state.spotifyToken);

    return new Response(JSON.stringify(playlists));
  },
});
