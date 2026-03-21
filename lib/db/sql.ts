import postgres from "postgres";
import { NEON_DATABASE_URL } from "@/lib/config.ts";

if (!NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL is not set");
}

export const sql = postgres(NEON_DATABASE_URL, {
  max: 5,
  prepare: false,
});
