import { SPOTIFY_AUTH, SPOTIFY_TOKEN_URL } from "@/lib/config.ts";
import { redirect } from "@/lib/utils.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import { FreshContext } from "fresh";

export type TokenData = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export const setSpotifyTokenCookie = (
  headers: Headers,
  token: Record<string, string>,
) =>
  setCookie(headers, {
    name: "spotifyToken",
    path: "/",
    value: encodeURIComponent(JSON.stringify(token)),
    maxAge: 400 * 24 * 60 * 60,
  });

export const getSpotifyTokenCookie = (ctx: FreshContext) => {
  try {
    return JSON.parse(
      decodeURIComponent(getCookies(ctx.req.headers).spotifyToken),
    );
  } catch (e) {
    console.warn("no spotify token cookie", e);
    return null;
  }
};

export const refreshSpotifyToken = async (
  rawToken: string,
) => {
  if (!rawToken) {
    return null;
  }

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
