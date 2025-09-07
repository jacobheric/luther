import "jsr:@std/dotenv/load";
import { createClient } from "jsr:@supabase/supabase-js@2";
export const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
);

export const supabase = createClient(
  SUPABASE_URL || "http://localhost",
  SUPABASE_SERVICE_ROLE_KEY || "test",
);

Deno.cron("ping supabase", { dayOfWeek: { every: 1 } }, async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id").limit(1);

  if (error) {
    console.error("error pinging supabase", error);
    return;
  }

  console.log("supabase successfully pinged", data);
});
