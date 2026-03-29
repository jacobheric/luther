import { Context } from "fresh";

import { IS_DEPLOYED } from "@/lib/config.ts";
import {
  type AppSession,
  clearAuthCookies,
  getAuthSession,
  isAllowedUserEmail,
  persistAuthSession,
  persistLoginFlow,
} from "@/lib/auth.ts";
import { spotifyLoginRedirect } from "@/lib/spotify/api.ts";
import {
  getSpotifyToken,
  refreshSpotifyToken,
  setSpotifyToken,
  SpotifyToken,
} from "@/lib/spotify/token.ts";
import { redirect } from "@/lib/utils.ts";

export type SignedInState = {
  session: AppSession;
};

export type SignedOutState = {
  session?: null;
};

export type AuthState = SignedInState | SignedOutState;

const unrestricted = [
  "/login",
  "/logout",
  "/policies",
];

const unrestrictedSpotify = [
  ...unrestricted,
  "/spotify/login",
  "/api/spotify/access-token",
];

const isApiRoute = (pathname: string) => pathname.startsWith("/api/");

const isLocalLoopbackAlias = (hostname: string) =>
  hostname === "localhost" || hostname === "::1" || hostname === "[::1]";

const toCanonicalLoopbackUrl = (url: URL) => {
  if (IS_DEPLOYED || !isLocalLoopbackAlias(url.hostname)) {
    return null;
  }

  const canonical = new URL(url.toString());
  canonical.hostname = "127.0.0.1";
  return canonical;
};

const authRequiredResponse = (url: URL) => {
  if (isApiRoute(url.pathname)) {
    const response = Response.json(
      { error: "Authentication required.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
    response.headers.set("x-luther-error-code", "auth-required");
    clearAuthCookies(response.headers);
    return response;
  }

  const redirectTarget = `${url.pathname}${url.search}`;
  const response = redirect(
    `/login/callback?redirect=${encodeURIComponent(redirectTarget)}`,
  );
  clearAuthCookies(response.headers);
  persistLoginFlow(response.headers, url);
  return response;
};

const unauthorizedUserResponse = (url: URL) => {
  if (isApiRoute(url.pathname)) {
    const response = Response.json(
      { error: "This account is not authorized.", code: "AUTH_FORBIDDEN" },
      { status: 403 },
    );
    response.headers.set("x-luther-error-code", "auth-forbidden");
    clearAuthCookies(response.headers);
    return response;
  }

  const response = redirect(
    "/login?error=This%20Google%20account%20is%20not%20authorized%20for%20this%20app.",
  );
  clearAuthCookies(response.headers);
  return response;
};

const spotifyAuthRequiredResponse = (url: URL) =>
  isApiRoute(url.pathname)
    ? (() => {
      const response = Response.json(
        {
          error: "Spotify authorization required.",
          code: "SPOTIFY_AUTH_REQUIRED",
          redirectTo: "/spotify/login",
        },
        { status: 403 },
      );
      response.headers.set("x-luther-error-code", "spotify-auth-required");
      return response;
    })()
    : spotifyLoginRedirect();

const appendHeaders = (oldResponse: Response, newResponse: Response) => {
  for (const [key, value] of [...oldResponse.headers]) {
    if (key.toLowerCase() === "set-cookie") {
      newResponse.headers.append(key, value);
      continue;
    }

    newResponse.headers.set(key, value);
  }
};

const authHandler = async (
  ctx: Context<{ spotifyToken: SpotifyToken } & AuthState>,
) => {
  const url = new URL(ctx.req.url);
  const canonicalLoopbackUrl = toCanonicalLoopbackUrl(url);

  if (canonicalLoopbackUrl) {
    return redirect(canonicalLoopbackUrl.toString());
  }

  if (
    unrestricted.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  const loadedSession = await getAuthSession(ctx.req);

  if (!loadedSession) {
    return authRequiredResponse(url);
  }

  ctx.state.session = loadedSession.session;

  if (!isAllowedUserEmail(ctx.state.session.user?.email)) {
    return unauthorizedUserResponse(url);
  }

  const nextResp = await ctx.next();

  if (loadedSession.shouldPersist) {
    persistAuthSession(nextResp.headers, ctx.url, loadedSession.token);
  }

  return nextResp;
};

const spotifyTokenHandler = async (
  ctx: Context<{ spotifyToken: SpotifyToken } & AuthState>,
) => {
  const url = new URL(ctx.req.url);
  if (
    unrestrictedSpotify.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  const token = await getSpotifyToken(ctx);

  if (!token) {
    return spotifyAuthRequiredResponse(url);
  }

  const refreshedToken = await refreshSpotifyToken(token);

  if (!refreshedToken) {
    return spotifyAuthRequiredResponse(url);
  }

  ctx.state.spotifyToken = refreshedToken;

  const resp = new Response();

  await setSpotifyToken(resp.headers, ctx, ctx.state.spotifyToken);
  const nextResp = await ctx.next();
  appendHeaders(resp, nextResp);
  return nextResp;
};

export const handler = [authHandler, spotifyTokenHandler];
