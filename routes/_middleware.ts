import { FreshContext } from "fresh";

import "@std/dotenv/load";

import { PRODUCTION } from "@/lib/config.ts";
import { spotifyAuthenticated, spotifyLoginRedirect } from "@/lib/spotify.ts";
import { createSupabaseClient } from "@/lib/supabase.ts";
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
  ctx: FreshContext<AuthState>,
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

//
// the spotify ts sdk handles auth tokens and refresh interally
// so we just look for an active user session
const spotifyAuthHandler = async (
  ctx: FreshContext,
) => {
  const url = new URL(ctx.req.url);
  if (
    unrestrictedSpotify.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  if (!(await spotifyAuthenticated())) {
    return spotifyLoginRedirect();
  }

  return ctx.next();
};

export const handler = [authHandler, spotifyAuthHandler];
