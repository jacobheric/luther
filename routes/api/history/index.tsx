import { define } from "@/lib/state.ts";
import { getSearchHistory } from "@/lib/db/history.ts";

export const handler = define.handlers({
  async GET(ctx) {
    if (!ctx.state.session) {
      return new Response("You must be logged in to fetch search history", {
        status: 401,
      });
    }

    const history = await getSearchHistory(ctx.state.session);
    return new Response(JSON.stringify(history));
  },
});
