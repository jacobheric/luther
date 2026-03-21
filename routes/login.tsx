import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { getNeonAuthUrl } from "@/lib/neon_auth.ts";
import { LoginForm } from "@/islands/login.tsx";

export const handler = define.handlers({
  GET(ctx) {
    const redirect = ctx.url.searchParams.get("redirect") ?? "/";

    return page({
      authUrl: getNeonAuthUrl(),
      redirect,
    });
  },
});

export default function Login(
  { data }: PageProps<{ authUrl: string; redirect: string }>,
) {
  return (
    <LoginForm
      authUrl={data.authUrl}
      redirect={data.redirect}
    />
  );
}
