import { getChatMessages, getChatThread } from "@/lib/db/chat.ts";
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
  async GET(ctx) {
    if (!ctx.state.session) {
      return new Response("You must be logged in to fetch thread messages", {
        status: 401,
      });
    }

    const threadId = toThreadId(ctx.params.id);

    if (!threadId) {
      return new Response("thread id is invalid", { status: 400 });
    }

    const thread = await getChatThread(ctx.state.session, threadId);

    if (!thread) {
      return new Response("thread not found", { status: 404 });
    }

    const messages = await getChatMessages(ctx.state.session, threadId);
    return new Response(JSON.stringify(messages));
  },
});
