import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { redirect } from "@/lib/utils.ts";
import { createSupabaseClient } from "@/lib/supabase.ts";
import { AuthError } from "@supabase/supabase-js";
import { assert } from "@std/assert";
import { LoginForm } from "@/islands/login.tsx";

export const handler = define.handlers({
  async POST(ctx) {
    const url = ctx.url.searchParams.get("redirect") ?? "/";

    const resp = redirect(url);
    const supabase = createSupabaseClient(ctx.req, resp);
    const form = await ctx.req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    assert(email, "email is required");
    assert(password, "password is required");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("failed to login", error);
      return page({
        error,
      });
    }

    return resp;
  },
});

export default function Login(
  { data }: PageProps<{ error?: AuthError }>,
) {
  return <LoginForm error={data?.error?.message} />;
}
