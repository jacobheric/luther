import { getCookies, setCookie } from "@std/http/cookie";
import { FreshContext } from "fresh";
import { SPOTIFY_AUTH, SPOTIFY_TOKEN_URL } from "@/lib/config.ts";
import { redirect } from "@/lib/utils.ts";

export type TokenData = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export const setTokenCookie = (headers: Headers, tokenData: TokenData) =>
  setCookie(headers, {
    name: "spotifyToken",
    path: "/",
    value: encodeURIComponent(JSON.stringify(tokenData)),
    maxAge: 400 * 24 * 60 * 60,
  });

export const getSpotifyToken = (ctx: FreshContext) =>
  getCookies(ctx.req.headers).spotifyToken;

export const refreshSpotifyToken = async (
  rawToken: string,
) => {
  const token = JSON.parse(
    decodeURIComponent(rawToken),
  );

  if (Date.now() >= token.expires_at) {
    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", token.refresh_token);

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${SPOTIFY_AUTH}`,
      },
      body,
    });

    const refreshedToken = await response.json();

    return refreshedToken
      ? {
        ...refreshedToken,
        expires_at: Date.now() + (refreshedToken.expires_in * 1000),
      }
      : null;
  }

  return token;
};
