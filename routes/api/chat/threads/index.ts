import { listChatThreads } from "@/lib/db/chat.ts";
import { define } from "@/lib/state.ts";

export const handler = define.handlers({
  async GET(ctx) {
    if (!ctx.state.session) {
      return new Response("You must be logged in to fetch chat threads", {
        status: 401,
      });
    }

    const threads = await listChatThreads(ctx.state.session);
    return new Response(JSON.stringify(threads));
  },
});
