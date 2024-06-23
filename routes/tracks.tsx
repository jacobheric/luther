import { Handlers, PageProps } from "$fresh/src/server/types.ts";
import { getCookies } from "$std/http/cookie.ts";
import { SavedTrack, SpotifyApi } from "npm:@spotify/web-api-ts-sdk";
import { SPOTIFY_CLIENT_ID } from "../lib/config.ts";

export type TracksRoute = {
  items?: SavedTrack[];
  offset: number;
  limit: number;
  total: number;
};

export const handler: Handlers<TracksRoute> = {
  async GET(req, ctx) {
    if (!SPOTIFY_CLIENT_ID) {
      throw new Error("spotify key not found!");
    }

    const token = JSON.parse(
      decodeURIComponent(getCookies(req.headers).spotifyToken),
    );

    if (!token) {
      return new Response("", {
        status: 307,
        headers: { Location: "/spotify/login" },
      });
    }

    const spotifySDK = SpotifyApi.withAccessToken(
      SPOTIFY_CLIENT_ID,
      token,
    );

    const data = await spotifySDK.currentUser.tracks.savedTracks();
    return ctx.render(data);
  },
};

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
