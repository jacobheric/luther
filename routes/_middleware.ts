import { FreshContext } from "fresh";

import "@std/dotenv/load";
import {
  BASIC_AUTH_PASSWORD,
  BASIC_AUTH_USER,
  PRODUCTION,
} from "@/lib/config.ts";
import {
  getSpotifyToken,
  refreshSpotifyToken,
  setTokenCookie,
  spotifyLoginRedirect,
  TokenData,
} from "@/lib/token.ts";

const unrestricted = [
  "/about",
  "/spotify/login",
  "/api/spotify/access-token",
];

const authHandler = (
  ctx: FreshContext,
) => {
  const url = new URL(ctx.req.url);

  if (!PRODUCTION) {
    return ctx.next();
  }

  if (
    unrestricted.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  if (
    ctx.req.headers.get("Authorization") !==
      `Basic ${btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)}`
  ) {
    const headers = new Headers({
      "WWW-Authenticate": 'Basic realm="Listen to Luther"',
    });
    return new Response("Unauthorized", { status: 401, headers });
  }

  return ctx.next();
};

const spotifyTokenHandler = async (
  ctx: FreshContext<{ spotifyToken: TokenData }>,
) => {
  const url = new URL(ctx.req.url);
  if (
    unrestricted.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  const token = getSpotifyToken(ctx);

  if (!token) {
    return spotifyLoginRedirect;
  }

  const refreshedToken = await refreshSpotifyToken(token);

  if (!refreshedToken) {
    return spotifyLoginRedirect;
  }

  ctx.state.spotifyToken = refreshedToken;

  return ctx.next();
};

const spotifyCookieHandler = async (
  ctx: FreshContext<{ spotifyToken: TokenData }>,
) => {
  const url = new URL(ctx.req.url);
  if (
    unrestricted.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }
  const response = await ctx.next();

  if (ctx.state.spotifyToken) {
    const modifiedResponse = new Response(response.body, response);
    setTokenCookie(modifiedResponse.headers, ctx.state.spotifyToken);
    return modifiedResponse;
  }

  return response;
};

export const handler = [authHandler, spotifyTokenHandler, spotifyCookieHandler];
