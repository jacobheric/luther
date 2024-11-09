import { define } from "@/lib/state.ts";
import { getDevices } from "@/lib/spotify.ts";

export const handler = define.handlers({
  async GET() {
    const devices = await getDevices();

    return new Response(JSON.stringify(devices));
  },
});
