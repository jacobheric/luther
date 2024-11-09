import { define } from "@/lib/state.ts";

import { queue } from "@/lib/spotify.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const device = form.get("device")?.toString();
    const uris = form.getAll("trackURI");

    if (!device || uris.length === 0) {
      throw Error("missing device or track uri");
    }

    await queue(
      device,
      uris.map((uri) => uri?.toString()),
    );

    return new Response(null, { status: 200 });
  },
});
