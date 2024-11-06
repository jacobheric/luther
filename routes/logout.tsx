import { define } from "@/lib/state.ts";
import { redirect } from "@/lib/utils.ts";
import { createSupabaseClient } from "@/lib/supabase.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const resp = redirect("/login");
    const supabase = createSupabaseClient(ctx.req, resp);
    await supabase.auth.signOut();

    return resp;
  },
});
