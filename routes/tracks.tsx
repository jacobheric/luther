import { getCookies } from "@std/http/cookie";
import { SavedTrack, SpotifyApi } from "npm:@spotify/web-api-ts-sdk";
import { SPOTIFY_CLIENT_ID } from "../lib/config.ts";
import { spotifyToken } from "@/lib/spotify.ts";
import { page, PageProps } from "fresh";
import { define } from "@/lib/state.ts";

export type TracksRoute = {
  items?: SavedTrack[];
  offset: number;
  limit: number;
  total: number;
};

export const handler = define.handlers({
  async GET(ctx) {
    if (!SPOTIFY_CLIENT_ID) {
      throw new Error("spotify key not found!");
    }

    const rawToken = getCookies(ctx.req.headers).spotifyToken;

    if (!rawToken) {
      return new Response("", {
        status: 307,
        headers: { Location: "/spotify/login" },
      });
    }

    let tracks;

    const token = await spotifyToken(ctx.url.origin, rawToken);

    try {
      const spotifySDK = SpotifyApi.withAccessToken(
        SPOTIFY_CLIENT_ID,
        token,
      );

      await spotifySDK.authenticate();

      tracks = await spotifySDK.currentUser.tracks.savedTracks();
    } catch (e) {
      console.error("spotify connect error", e);
    }

    return page(tracks);
  },
});

const Tracks = (
  { data: { items, limit, offset, total } }: PageProps<
    TracksRoute
  >,
) => {
  return (
    <div className="m-6 ">
      <div className="my-2 text">
        {offset + 1} to {offset + limit} of {total}
      </div>
      {items?.map((t) => (
        <div className="flex flex-row justify-start my-2 items-center border border-gray-100">
          <div className="mr-2">
            <img
              src={t.track.album.images.find((i) => i.height === 64)?.url}
            />
          </div>
          <div className="mr-2 font-bold">{t.track.artists[0].name}</div>
          <div className="mr-2 font-medium">{t.track.album.name}</div>
        </div>
      ))}
    </div>
  );
};

export default Tracks;
