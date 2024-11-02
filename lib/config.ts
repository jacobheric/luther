import { encodeBase64 } from "@std/encoding/base64";

export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
export const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");
export const SPOTIFY_AUTH = encodeBase64(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
);
export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
