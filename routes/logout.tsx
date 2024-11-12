import { define } from "@/lib/state.ts";
import { redirect } from "@/lib/utils.ts";
import { createSupabaseClient } from "@/lib/supabase.ts";
import { deleteCookie } from "@std/http/cookie";

export const handler = define.handlers({
  async GET(ctx) {
    const resp = redirect("/login");

    const supabase = createSupabaseClient(ctx.req, resp);
    await supabase.auth.signOut();

    deleteCookie(resp.headers, "spotifyToken");

    return resp;
  },
});
