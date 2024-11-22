import { define } from "@/lib/state.ts";

import { Mode, streamSongs } from "@/lib/ai/ai.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const prompt = form.get("prompt")?.toString();
    const mode = form.get("mode")?.toString() as Mode | undefined;

    if (!prompt) {
      return new Response("prompt is required", { status: 400 });
    }

    if (mode && !["smart", "recent", "fast"].includes(mode)) {
      return new Response("mode must be smart, recent, or fast", {
        status: 400,
      });
    }

    const body = new ReadableStream({
      start(controller) {
        streamSongs({ prompt, mode, controller });
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Connection": ":keep-alive",
      },
    });
  },
});
