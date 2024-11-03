import { TokenData } from "@/lib/spotify.ts";
import { setCookie } from "@std/http/cookie";

export const setTokenCookie = (headers: Headers, tokenData: TokenData) =>
  setCookie(headers, {
    name: "spotifyToken",
    path: "/",
    value: encodeURIComponent(JSON.stringify(tokenData)),
    maxAge: 400 * 24 * 60 * 60,
  });
