import { encodeBase64 } from "@std/encoding/base64";
import "@std/dotenv/load";

export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
export const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");
export const SPOTIFY_AUTH = encodeBase64(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
);
export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
export const GROK_API_KEY = Deno.env.get("GROK_API_KEY");

export const PRODUCTION = Deno.env.get("PRODUCTION") === "true";
export const IS_DEPLOYED = Boolean(Deno.env.get("DENO_DEPLOYMENT_ID"));

export const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
export const NEON_DATABASE_URL = Deno.env.get("NEON_DATABASE_URL");
export const NEON_AUTH_URL = Deno.env.get("NEON_AUTH_URL");
export const NEON_DATA_API_URL = Deno.env.get("NEON_DATA_API_URL");

export const ME_EMAIL = Deno.env.get("ME_EMAIL");
export const TEST_MODE = Deno.env.get("TEST_MODE") === "true";
