import { getCookies, setCookie } from "@std/http/cookie";
import { FreshContext } from "fresh";
import { signal } from "@preact/signals";

const refreshSignal = signal<Promise<TokenData | null> | null>(null);

export type TokenData = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export const getSpotifyToken = async (ctx: FreshContext) => {
  const rawToken = getCookies(ctx.req.headers).spotifyToken;
  if (!rawToken) {
    return null;
  }
  return await refreshSpotifyToken(ctx.url.origin, rawToken);
};
export const setTokenCookie = (headers: Headers, tokenData: TokenData) =>
  setCookie(headers, {
    name: "spotifyToken",
    path: "/",
    value: encodeURIComponent(JSON.stringify(tokenData)),
    maxAge: 400 * 24 * 60 * 60,
  });

const fetchNewToken = async (
  origin: string,
  refreshToken: string,
): Promise<TokenData | null> => {
  const response = await fetch(
    `${origin}/api/spotify/refresh-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!response.ok) {
    console.error("Failed to refresh token", response);
    return null;
  }

  return await response.json();
};

export const refreshSpotifyToken = async (
  origin: string,
  rawToken: string,
) => {
  const token = JSON.parse(
    decodeURIComponent(rawToken),
  );

  if (!token.expires_at || Date.now() >= token.expires_at) {
    if (refreshSignal.value) {
      return await refreshSignal.value;
    }

    try {
      refreshSignal.value = fetchNewToken(origin, token.refresh_token);
      return await refreshSignal.value;
    } finally {
      refreshSignal.value = null;
    }
  }

  return token;
};
