import { define } from "@/lib/state.ts";
import { getNowPlaying } from "@/lib/spotify/api.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const nowPlaying = await getNowPlaying(ctx.state.spotifyToken);
    return Response.json(nowPlaying);
  },
});
