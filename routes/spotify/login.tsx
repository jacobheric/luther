import { Handlers, PageProps } from "$fresh/server.ts";
import { SPOTIFY_CLIENT_ID } from "../../lib/config.ts";

export type SpotifyKey = {
  origin: string;
  spotifyClientId?: string;
};

export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.render({
      spotifyClientId: SPOTIFY_CLIENT_ID,
      origin: ctx.url.origin,
    });
  },
};

export default function SpotifyLogin(
  { data: { spotifyClientId, origin } }: PageProps<
    SpotifyKey
  >,
) {
  return (
    <div className="m-8">
      <form action="https://accounts.spotify.com/authorize" method="get">
        <input type="hidden" name="response_type" value="code" />
        <input type="hidden" name="client_id" value={spotifyClientId} />
        <input type="hidden" name="scope" value="user-library-read" />
        <input
          type="hidden"
          name="redirect_uri"
          value={`${origin}/api/spotify/access-token`}
        />
        <button
          className="border border-gray-200 p-3 rounded-m"
          type="submit"
        >
          Login To Spotify
        </button>
      </form>
    </div>
  );
}
