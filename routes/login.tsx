import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { redirect } from "@/lib/utils.ts";
import { createSupabaseClient } from "@/lib/supabase.ts";
import { AuthError } from "@supabase/supabase-js";
import { assert } from "@std/assert";

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
  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6">
      {data?.error && <p class="text-red-500">{data?.error?.message}</p>}
      <form method="post">
        <div class="flex flex-col gap-4">
          <label for="email">Email</label>
          <input
            type="email"
            name="email"
            required
          />

          <label for="password">Password</label>
          <input
            type="password"
            name="password"
            required
          />
          <button type="submit">
            Login
          </button>
          <div>
            <a className="tracking-wid underline-offset-4" href="/signup">
              signup
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
