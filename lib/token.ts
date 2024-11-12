import { SPOTIFY_AUTH, SPOTIFY_TOKEN_URL } from "@/lib/config.ts";
import { redirect } from "@/lib/utils.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import { FreshContext } from "fresh";

export type SpotifyToken = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export const setSpotifyToken = (
  headers: Headers,
  token: SpotifyToken,
) =>
  setCookie(headers, {
    name: "spotifyToken",
    path: "/",
    value: encodeURIComponent(JSON.stringify(token)),
    maxAge: 400 * 24 * 60 * 60,
  });

export const getSpotifyToken = (ctx: FreshContext) => {
  const rawToken = getCookies(ctx.req.headers).spotifyToken;

  if (!rawToken) {
    console.warn("no spotify token cookie, redirecting to spotify login");
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(rawToken));
  } catch (e) {
    console.error("parsing spotify token cookie failed", e);
    return null;
  }
};

export const refreshSpotifyToken = async (
  token: SpotifyToken | null,
) => {
  if (!token) {
    return null;
  }

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

    if (!response.ok) {
      console.error(
        "error refreshing spotify token, redirecting to spotify login",
        response,
      );
      return null;
    }

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
