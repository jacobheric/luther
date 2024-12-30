import { define } from "@/lib/state.ts";
import { deleteSearchHistory } from "@/lib/db/history.ts";

export const handler = define.handlers({
  async DELETE(ctx) {
    if (!ctx.state.session) {
      return new Response("You must be logged in to alter search history", {
        status: 401,
      });
    }

    const id = ctx.params.id;

    if (!id) {
      return new Response("search history` is required", { status: 400 });
    }

    const history = await deleteSearchHistory(ctx.state.session, id);
    return new Response(JSON.stringify(history));
  },
});
