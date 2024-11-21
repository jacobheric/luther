import { encodeBase64 } from "@std/encoding/base64";

export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
export const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");
export const SPOTIFY_AUTH = encodeBase64(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
);
export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
export const GROK_API_KEY = Deno.env.get("GROK_API_KEY");

export const PRODUCTION = Deno.env.get("PRODUCTION") === "true";

export const BASIC_AUTH_USER = Deno.env.get("BASIC_AUTH_USER");
export const BASIC_AUTH_PASSWORD = Deno.env.get("BASIC_AUTH_PASSWORD");

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
export const SUPABASE_PUBLIC_KEY = Deno.env.get("SUPABASE_PUBLIC_KEY");
export const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

export const CLOUDFLARE_TURNSTILE_SITE_KEY = Deno.env.get(
  "CLOUDFLARE_TURNSTILE_SITE_KEY",
);
export const CLOUDFLARE_TURNSTILE_SECRET_KEY = Deno.env.get(
  "CLOUDFLARE_TURNSTILE_SECRET_KEY",
);

export const ME_EMAIL = Deno.env.get("ME_EMAIL");
export const TEST_SONGS = Deno.env.get("TEST_SONGS") === "true";
