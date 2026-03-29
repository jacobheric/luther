import postgres from "postgres";
import { NEON_DATABASE_URL } from "@/lib/config.ts";

if (!NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL is not set");
}

//
// Postgres internal OIDs for JSON column types. These are permanent and
// the same across every Postgres installation.
const PG_OID_JSON = 114;
const PG_OID_JSONB = 3802;

export const sql = postgres(NEON_DATABASE_URL, {
  max: 5,
  prepare: false,
  types: {
    //
    // Explicitly register JSON/JSONB parsers so they are always applied
    // regardless of query mode (simple vs extended protocol).
    json: { to: PG_OID_JSON, from: [PG_OID_JSON], serialize: JSON.stringify, parse: JSON.parse },
    jsonb: { to: PG_OID_JSONB, from: [PG_OID_JSONB], serialize: JSON.stringify, parse: JSON.parse },
  },
});
