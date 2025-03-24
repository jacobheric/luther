import { define } from "@/lib/state.ts";

import { streamSongs } from "@/lib/ai/ai.ts";
import { saveSearch } from "@/lib/db/history.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const prompt = form.get("prompt")?.toString();
    const web = form.get("web")?.toString() === "on";

    if (!prompt) {
      return new Response("prompt is required", { status: 400 });
    }

    //
    // in prod save searches to db
    if (ctx.state.session) {
      saveSearch(ctx.state.session, prompt);
    }

    const body = new ReadableStream({
      start(controller) {
        streamSongs({ prompt, web, controller });
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
