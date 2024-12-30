import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/config.ts";
import { assert } from "@std/assert";

assert(SUPABASE_URL, "SUPABASE_URL is not set");
assert(SUPABASE_PUBLIC_KEY, "SUPABASE_ANON_KEY is not set");

export const supabase = createClient(SUPABASE_URL!, SUPABASE_PUBLIC_KEY!);
