import { load } from "$std/dotenv/mod.ts";

const env = await load();

export const SPOTIFY_CLIENT_ID = env["SPOTIFY_CLIENT_ID"] ||
  Deno.env.get("SPOTIFY_CLIENT_ID");

export const SPOTIFY_CLIENT_SECRET = env["SPOTIFY_CLIENT_SECRET"] ||
  Deno.env.get("SPOTIFY_CLIENT_SECRET");
