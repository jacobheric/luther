import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./config.ts";

export const supabase = createClient(
  SUPABASE_URL || "http://localhost",
  SUPABASE_SERVICE_ROLE_KEY || "test",
);

Deno.cron("ping supabase", { minute: { every: 1 } }, async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id").limit(1);

  if (error) {
    console.error("error pinging supabase", error);
    return;
  }

  console.log("supabase successfully pinged", data);
});
