import {
  clearLoginFlow,
  createAuthSession,
  getCallbackUser,
  hasLoginFlow,
  isAllowedUserEmail,
  persistLoginFlow,
} from "@/lib/auth.ts";
import { getNeonAuthUrl } from "@/lib/neon_auth.ts";
import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { LoginCallback } from "@/islands/login_callback.tsx";
import { toSafeRedirectPath } from "@/lib/utils.ts";

const getRedirectTarget = (url: URL) =>
  toSafeRedirectPath(url.searchParams.get("redirect"));

export const handler = define.handlers({
  GET(ctx) {
    const error = ctx.url.searchParams.get("error") ?? undefined;
    const headers = new Headers();

    persistLoginFlow(headers, ctx.url);

    return page({ authUrl: getNeonAuthUrl(), error }, { headers });
  },
  async POST(ctx) {
    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;

    if (!body || !hasLoginFlow(ctx.req)) {
      return Response.json(
        { error: "OAuth callback did not return a valid session." },
        { status: 400 },
      );
    }

    const user = getCallbackUser(body);

    if (!user) {
      return Response.json(
        { error: "Failed to read the Google login session." },
        { status: 401 },
      );
    }

    if (!isAllowedUserEmail(user.email)) {
      return Response.json(
        { error: "Sorry, not for you!" },
        { status: 403 },
      );
    }

    const headers = new Headers();
    clearLoginFlow(headers);
    await createAuthSession(headers, ctx.url, user);

    return Response.json(
      { redirectTo: getRedirectTarget(ctx.url) },
      { headers },
    );
  },
});

export default function LoginCallbackRoute(
  { data }: PageProps<{ authUrl: string; error?: string }>,
) {
  return <LoginCallback authUrl={data.authUrl} error={data?.error} />;
}
