import { define } from "@/lib/state.ts";
import { getDevices } from "@/lib/spotify/api.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const devices = await getDevices(ctx.state.spotifyToken);

    return new Response(JSON.stringify(devices));
  },
});
