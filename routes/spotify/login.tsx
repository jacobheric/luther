import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { SPOTIFY_CLIENT_ID } from "@/lib/config.ts";
import { getSpotifyRedirectUri } from "@/lib/spotify/redirect.ts";

export type SpotifyKey = {
  redirectUri: string;
  spotifyClientId?: string;
};

export const handler = define.handlers({
  GET(ctx) {
    return page({
      spotifyClientId: SPOTIFY_CLIENT_ID,
      redirectUri: getSpotifyRedirectUri(ctx.url),
    });
  },
});

export default function SpotifyLogin(
  { data: { spotifyClientId, redirectUri } }: PageProps<
    SpotifyKey
  >,
) {
  return (
    <div className="m-8">
      <form action="https://accounts.spotify.com/authorize" method="GET">
        <input type="hidden" name="response_type" value="code" />
        <input type="hidden" name="client_id" value={spotifyClientId} />
        <input
          type="hidden"
          name="scope"
          value="user-library-read,user-library-modify,user-read-playback-state,user-read-currently-playing,user-modify-playback-state,playlist-modify-private,playlist-read-private"
        />
        <input
          type="hidden"
          name="redirect_uri"
          value={redirectUri}
        />
        <div className="prose dark:prose-invert mb-10">
          Luther needs permission to do a few things for you on Spotify. After
          he helps you find the music you want, he can create playlists, queue
          music and play music.
        </div>
        <div className="flex justify-center">
          <button type="submit" className="cursor-pointer">
            Authorize Luther on Spotify
          </button>
        </div>
      </form>
    </div>
  );
}
