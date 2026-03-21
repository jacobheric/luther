import { clearAuthCookies } from "@/lib/auth.ts";
import { define } from "@/lib/state.ts";
import { redirect } from "@/lib/utils.ts";
import { deleteCookie } from "@std/http/cookie";

export const handler = define.handlers({
  GET() {
    const resp = redirect("/login");

    deleteCookie(resp.headers, "spotifyToken");
    clearAuthCookies(resp.headers);

    return resp;
  },
});
