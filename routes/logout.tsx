import { revokeAuthSession } from "@/lib/auth.ts";
import { getNeonAuthUrl } from "@/lib/neon_auth.ts";
import { define } from "@/lib/state.ts";
import { LogoutPage } from "@/islands/logout.tsx";
import { deleteCookie } from "@std/http/cookie";
import { page, PageProps } from "fresh";

export const handler = define.handlers({
  GET() {
    return page({
      authUrl: getNeonAuthUrl(),
    });
  },
  async POST(ctx) {
    const headers = new Headers();

    await revokeAuthSession(headers, ctx.req);
    deleteCookie(headers, "spotifyToken", { path: "/" });

    return new Response(null, { status: 204, headers });
  },
});

export default function Logout(
  { data }: PageProps<{ authUrl: string }>,
) {
  return <LogoutPage authUrl={data.authUrl} />;
}
