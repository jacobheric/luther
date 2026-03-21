import { deleteChatThread } from "@/lib/db/chat.ts";
import { define } from "@/lib/state.ts";

const toThreadId = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const threadId = Number.parseInt(value, 10);

  if (!Number.isInteger(threadId) || threadId <= 0) {
    return null;
  }

  return threadId;
};

export const handler = define.handlers({
  async DELETE(ctx) {
    if (!ctx.state.session) {
      return new Response("You must be logged in to delete thread history", {
        status: 401,
      });
    }

    const threadId = toThreadId(ctx.params.id);

    if (!threadId) {
      return new Response("thread id is invalid", { status: 400 });
    }

    const deleted = await deleteChatThread(ctx.state.session, threadId);

    if (!deleted) {
      return new Response("thread not found", { status: 404 });
    }

    return new Response(null, { status: 204 });
  },
});
