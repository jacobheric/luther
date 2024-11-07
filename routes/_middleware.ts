import { FreshContext } from "fresh";

import {
  getSpotifyToken,
  refreshSpotifyToken,
  setTokenCookie,
  spotifyLoginRedirect,
  TokenData,
} from "@/lib/token.ts";
import "@std/dotenv/load";

import { createSupabaseClient } from "@/lib/supabase.ts";
import { Session } from "@supabase/supabase-js";
import { redirect } from "@/lib/utils.ts";

export type SignedInState = {
  session: Session;
};

export type SignedOutState = {
  session?: null;
};

export type AuthState = SignedInState | SignedOutState;

const unrestricted = [
  "/about",
  "/login",
  "/signup",
  "/password",
  "/logout",
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
  ctx: FreshContext<AuthState>,
) => {
  const url = new URL(ctx.req.url);

  // if (!PRODUCTION) {
  //   return ctx.next();
  // }

  if (
    unrestricted.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  const resp = new Response();
  const supabase = createSupabaseClient(ctx.req, resp);

  const { data: sessionData } = await supabase.auth.getSession();
  //  const { data: userData } = await supabase.auth.getUser();

  ctx.state.session = sessionData.session;

  if (!ctx.state.session) {
    return redirect(
      "/about",
    );
  }

  const nextResp = await ctx.next();
  appendHeaders(resp, nextResp);
  return nextResp;
};

const spotifyTokenHandler = async (
  ctx: FreshContext<{ spotifyToken: TokenData }>,
) => {
  const url = new URL(ctx.req.url);
  if (
    unrestrictedSpotify.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  const token = getSpotifyToken(ctx);

  if (!token) {
    return spotifyLoginRedirect();
  }

  const refreshedToken = await refreshSpotifyToken(token);

  if (!refreshedToken) {
    return spotifyLoginRedirect();
  }

  ctx.state.spotifyToken = refreshedToken;

  const resp = new Response();

  setTokenCookie(resp.headers, ctx.state.spotifyToken);
  const nextResp = await ctx.next();
  appendHeaders(resp, nextResp);
  return nextResp;
};

const spotifyCookieHandler = async (
  ctx: FreshContext<{ spotifyToken: TokenData }>,
) => {
  const url = new URL(ctx.req.url);
  if (
    unrestrictedSpotify.some((route) => url.pathname.startsWith(route))
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

export const handler = [authHandler, spotifyTokenHandler];
