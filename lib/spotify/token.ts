import { SPOTIFY_AUTH, SPOTIFY_TOKEN_URL } from "@/lib/config.ts";
import { redirect } from "@/lib/utils.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import { FreshContext } from "fresh";
import { AuthState } from "@/routes/_middleware.ts";
import { supabase } from "@/lib/db/supabase.ts";
import { getUser } from "@/lib/db/user.ts";

export type SpotifyToken = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export const spotifyLoginRedirect = () => redirect("/spotify/login");

export const setSpotifyToken = async (
  headers: Headers,
  ctx: FreshContext<AuthState>,
  token: SpotifyToken,
) => {
  setCookie(headers, {
    name: "spotifyToken",
    path: "/",
    value: encodeURIComponent(JSON.stringify(token)),
    maxAge: 400 * 24 * 60 * 60,
  });

  if (!ctx.state.session) {
    console.error("no auth session, not saving spotify token to db");
    return;
  }

  const user = await getUser(ctx.state.session);

  //
  // so we don't prompt them to auth spotify again on a new device
  const { error } = await supabase
    .from("users")
    .upsert({ user_id: user.data.user?.id, spotify_token: token }, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("error upserting spotify token to db", error);
  }
};

//
// fetch token from cookie first for speed, then from db for
// cross device compatibility
export const getSpotifyToken = async (ctx: FreshContext<AuthState>) => {
  const rawToken = getCookies(ctx.req.headers).spotifyToken;

  if (rawToken) {
    try {
      return JSON.parse(decodeURIComponent(rawToken));
    } catch (e) {
      console.error("parsing spotify token cookie failed", e);
    }
  }

  if (!ctx.state.session) {
    console.log("no user session, skipping db spotify token fetch");
    return null;
  }
  const user = await getUser(ctx.state.session);

  const { data, error } = await supabase
    .from("users")
    .select("spotify_token")
    .eq("user_id", user.data.user?.id)
    .single();

  if (error) {
    console.error("error fetching spotify token from db", error);
    return null;
  }

  if (data?.spotify_token) {
    return data.spotify_token;
  }

  return null;
};

export const refreshSpotifyToken = async (
  token: SpotifyToken | null,
) => {
  if (!token) {
    console.error(
      "no token, aborting refresh",
    );
    return null;
  }

  if (Date.now() <= token.expires_at) {
    return token;
  }

  if (!token.refresh_token) {
    console.error(
      "no refresh token on access token, aborting refresh",
    );
    return null;
  }

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
      "error refreshing spotify token",
      response,
    );
    return null;
  }

  const refreshedToken = await response.json();
  const adjustedToken = refreshedToken
    ? {
      ...refreshedToken,
      expires_at: Date.now() + (refreshedToken.expires_in * 1000),
      refresh_token: token.refresh_token,
    }
    : null;

  return adjustedToken;
};

export const getAppToken = async () => {
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");

  //
  // Spotify search using user tokens is SUPER sketchy
  // (as in does not work at all for some users),
  // so use our client credentials token here.
  // could present some problems for our international users
  const appTokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${SPOTIFY_AUTH}`,
    },
    body,
  });

  return await appTokenResponse.json();
};
