import { define } from "@/lib/state.ts";

import { page, PageProps } from "fresh";

import Password from "@/islands/password.tsx";
import { supabase } from "@/lib/db/supabase.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const password = form.get("password")?.toString();
    const token = form.get("token")?.toString();
    const refreshToken = form.get("refreshToken")?.toString();

    if (!refreshToken || !token || !password) {
      return page({
        error:
          "A valid invite token and password are required. They only work once. Maybe try another sign up.",
      });
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return page({
        error:
          "Invite token is invalid. They only work once. Maybe try another sign up.",
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
