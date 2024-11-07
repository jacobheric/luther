import { define } from "@/lib/state.ts";

import { page, PageProps } from "fresh";

import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/config.ts";
import { createClient } from "@supabase/supabase-js";

import Password from "@/islands/password.tsx";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const password = form.get("password")?.toString();
    const token = form.get("token")?.toString();
    const refreshToken = form.get("refreshToken")?.toString();

    if (!refreshToken || !token || !password) {
      return page({
        error: "A valid invite token and password are required.",
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_PUBLIC_KEY!);

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return page({
        error: "Invite token is invalid. Maybe try another sign up.",
      });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return page({
        error:
          `Update password failed. ${updateError.message} Please try again. `,
      });
    }

    return page({ success: true });
  },
});

export const PasswordRoute = (
  { data }: PageProps<{ error?: string; success?: boolean }>,
) => <Password error={data?.error} success={data?.success} />;

export default PasswordRoute;
