import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { persistLoginFlow } from "@/lib/auth.ts";
import { getNeonAuthUrl } from "@/lib/neon_auth.ts";
import { toSafeRedirectPath } from "@/lib/utils.ts";
import { LoginForm } from "@/islands/login.tsx";

export const handler = define.handlers({
  GET(ctx) {
    const redirect = toSafeRedirectPath(ctx.url.searchParams.get("redirect"));
    const error = ctx.url.searchParams.get("error") ?? undefined;
    const headers = new Headers();

    persistLoginFlow(headers, ctx.url);

    return page({
      authUrl: getNeonAuthUrl(),
      redirect,
      error,
    }, { headers });
  },
});

export default function Login(
  { data }: PageProps<{ authUrl: string; redirect: string; error?: string }>,
) {
  return (
    <LoginForm
      authUrl={data.authUrl}
      redirect={data.redirect}
      error={data.error}
    />
  );
}
