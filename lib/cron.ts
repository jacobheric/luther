import { sql } from "./db/sql.ts";

Deno.cron("ping neon", { dayOfWeek: { every: 1 } }, async () => {
  try {
    const rows = await sql`select 1 as ok`;
    console.log("neon successfully pinged", rows);
  } catch (error) {
    console.error("error pinging neon", error);
  }
});
