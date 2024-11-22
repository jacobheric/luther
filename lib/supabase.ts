import { assert } from "@std/assert";

import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/config.ts";

export function createSupabaseClient(req: Request, resp: Response) {
  assert(SUPABASE_URL, "SUPABASE_URL is not set");
  assert(SUPABASE_PUBLIC_KEY, "SUPABASE_ANON_KEY is not set");

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.get("Cookie") || "");
      },

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookie = serializeCookieHeader(name, value, options);
          // If the cookie is updated, update the cookies for the response
          resp.headers.append("Set-Cookie", cookie);
        });
      },
    },
  });

  return supabase;
}
