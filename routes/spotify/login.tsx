import { SPOTIFY_CLIENT_ID } from "@/lib/config.ts";
import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import SpotifyLogin from "@/islands/spotifyLogin.tsx";

export type SpotifyKey = {
  origin: string;
  spotifyClientId: string;
  code?: string;
};

export const handler = define.handlers({
  GET(ctx) {
    return page({
      spotifyClientId: SPOTIFY_CLIENT_ID,
      origin: ctx.url.origin,
    });
  },
  POST(ctx) {
    return page({
      spotifyClientId: SPOTIFY_CLIENT_ID,
      origin: ctx.url.origin,
    });
  },
});

export default function SpotifyLoginRoute(
  { data: { spotifyClientId, origin } }: PageProps<
    SpotifyKey
  >,
) {
  return (
    <SpotifyLogin
      spotifyClientId={spotifyClientId}
      origin={origin}
    />
  );
}
