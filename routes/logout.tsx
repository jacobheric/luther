import { revokeAuthSession } from "@/lib/auth.ts";
import { define } from "@/lib/state.ts";
import { deleteCookie } from "@std/http/cookie";

export const handler = define.handlers({
  GET() {
    return Response.redirect("/login", 302);
  },
  async POST(ctx) {
    const headers = new Headers();

    await revokeAuthSession(headers, ctx.req);
    deleteCookie(headers, "spotifyToken", { path: "/" });

    headers.set("Location", "/login");
    return new Response(null, { status: 302, headers });
  },
});
