import { FreshContext } from "fresh";

import { PRODUCTION } from "@/lib/config.ts";
import { spotifyLoginRedirect } from "@/lib/spotify/api.ts";
import { createSupabaseClient } from "@/lib/supabase.ts";
import {
  getSpotifyToken,
  refreshSpotifyToken,
  SpotifyToken,
} from "@/lib/spotify/token.ts";
import { redirect } from "@/lib/utils.ts";
import { Session } from "@supabase/supabase-js";

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

  const resp = new Response();
  const supabase = createSupabaseClient(ctx.req, resp);

  const { data: sessionData } = await supabase.auth.getSession();

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

  const refreshedToken = await refreshSpotifyToken(ctx, token);

  if (!refreshedToken) {
    return spotifyLoginRedirect();
  }

  ctx.state.spotifyToken = refreshedToken;
  return ctx.next();
};

export const handler = [authHandler, spotifyTokenHandler];
