import {
  type AppSession,
  type AppUser,
  persistAuthSession,
} from "@/lib/auth.ts";
import { getNeonAuthUrl } from "@/lib/neon_auth.ts";
import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { LoginCallback } from "@/islands/login_callback.tsx";

const getRedirectTarget = (url: URL) => url.searchParams.get("redirect") ?? "/";

//
// Better Auth's native getSession() returns { session: { token, ... }, user: { id, email, name, ... } }
const firstNonEmpty = (values: unknown[]) =>
  values.find((value): value is string =>
    typeof value === "string" && value.length > 0
  ) ?? "";

const toAppSession = (
  body: Record<string, unknown>,
): AppSession | null => {
  const session = body.session as Record<string, unknown> | undefined;
  const user = body.user as Partial<AppUser> | undefined;
  const token = firstNonEmpty([
    session?.token,
    session?.access_token,
    body.access_token,
  ]);
  const refreshToken = firstNonEmpty([
    session?.refreshToken,
    session?.refresh_token,
    body.refresh_token,
  ]);

  if (!token || !user?.id) {
    return null;
  }

  return {
    access_token: token,
    refresh_token: refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
};

export const handler = define.handlers({
  GET(ctx) {
    const error = ctx.url.searchParams.get("error") ?? undefined;

    return page({ authUrl: getNeonAuthUrl(), error });
  },
  async POST(ctx) {
    const body = await ctx.req.json();
    const appSession = toAppSession(body);

    if (!appSession) {
      return Response.json(
        { error: "OAuth callback did not return a valid session." },
        { status: 400 },
      );
    }

    const headers = new Headers();
    persistAuthSession(headers, ctx.url, appSession);

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
