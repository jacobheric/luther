import { FreshContext } from "fresh";

import { PRODUCTION } from "@/lib/config.ts";
import {
  type AppSession,
  clearAuthCookies,
  getAuthSession,
  persistAuthSession,
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

const appendHeaders = (oldResponse: Response, newResponse: Response) => {
  for (const [key, value] of [...oldResponse.headers]) {
    newResponse.headers.set(key, value);
  }
};

const authHandler = async (
  ctx: FreshContext<{ spotifyToken: SpotifyToken } & AuthState>,
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

  ctx.state.session = getAuthSession(ctx.req);

  if (!ctx.state.session) {
    const resp = redirect("/login");
    clearAuthCookies(resp.headers);
    return resp;
  }

  const nextResp = await ctx.next();
  persistAuthSession(nextResp.headers, ctx.url, ctx.state.session);
  return nextResp;
};

const spotifyTokenHandler = async (
  ctx: FreshContext<{ spotifyToken: SpotifyToken } & AuthState>,
) => {
  const url = new URL(ctx.req.url);
  if (
    unrestrictedSpotify.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  const token = await getSpotifyToken(ctx);

  if (!token) {
    return spotifyLoginRedirect();
  }

  const refreshedToken = await refreshSpotifyToken(token);

  if (!refreshedToken) {
    return spotifyLoginRedirect();
  }

  ctx.state.spotifyToken = refreshedToken;

  const resp = new Response();

  await setSpotifyToken(resp.headers, ctx, ctx.state.spotifyToken);
  const nextResp = await ctx.next();
  appendHeaders(resp, nextResp);
  return nextResp;
};

export const handler = [authHandler, spotifyTokenHandler];
