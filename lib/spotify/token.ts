import { SPOTIFY_AUTH, SPOTIFY_TOKEN_URL } from "@/lib/config.ts";
import { redirect } from "@/lib/utils.ts";
import { getCookies } from "@std/http/cookie";
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
  ctx: FreshContext<AuthState>,
  token: SpotifyToken,
) => {
  if (!ctx.state.session) {
    console.error("no auth session, ignoring setSpotifyToken");
    return;
  }

  const user = await getUser(ctx.state.session);

  const { error } = await supabase
    .from("users")
    .upsert([
      {
        user_id: user.data.user?.id,
        spotify_token: token,
      },
    ]);

  if (error) {
    console.error("error upserting spotify token", error);
  }
};

export const getSpotifyToken = async (ctx: FreshContext<AuthState>) => {
  if (ctx.state.session) {
    const user = await getUser(ctx.state.session);

    const { data, error } = await supabase
      .from("users")
      .select("spotify_token")
      .eq("user_id", user.data.user?.id)
      .single();

    if (error) {
      console.error("error fetching spotify token", error);
      return null;
    }

    if (data?.spotify_token) {
      return data.spotify_token;
    }
  }

  //
  // TODO: this is deprecated in favor of db storage above
  // and can be removed soon
  const rawToken = getCookies(ctx.req.headers).spotifyToken;

  if (!rawToken) {
    console.warn("no spotify token cookie");
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
  ctx: FreshContext<AuthState>,
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

  if (adjustedToken) {
    setSpotifyToken(ctx, adjustedToken);
  }

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
