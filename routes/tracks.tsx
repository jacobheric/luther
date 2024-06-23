import { Handlers, PageProps } from "$fresh/src/server/types.ts";
import {
  AccessToken,
  SavedTrack,
  SpotifyApi,
} from "npm:@spotify/web-api-ts-sdk";
import { spotifyToken } from "./api/spotify-token.ts";

export type TracksRoute = {
  tracks?: SavedTrack[];
  total: number;
};

const getTracks = async (token: AccessToken) => {
  const spotifySDK = SpotifyApi.withAccessToken(
    "91003acf10384519b1a792da5a7cf462-id",
    token,
  );

  const page = await spotifySDK.currentUser.tracks.savedTracks();
  const { limit, total, items } = page;
  let tracks = [...items];

  for (let i = 0; i < total; i += limit) {
    const { items: more } = await spotifySDK.currentUser.tracks.savedTracks(
      limit as 50,
      i,
    );
    tracks = [...tracks, ...more];
  }
  return { tracks, total };
};

export const handler: Handlers<TracksRoute> = {
  async GET(_req, ctx) {
    if (!spotifyToken.value) {
      return new Response("", {
        status: 307,
        headers: { Location: "/" },
      });
    }
    const { tracks, total } = await getTracks(spotifyToken.value);

    return ctx.render({
      tracks,
      total,
    });
  },

  async POST(_req, ctx) {
    if (!spotifyToken.value) {
      return new Response("", {
        status: 307,
        headers: { Location: "/" },
      });
    }

    const { tracks, total } = await getTracks(spotifyToken.value);

    return ctx.render({
      tracks,
      total,
    });
  },
};

const Tracks = (
  { data: { tracks, total } }: PageProps<
    TracksRoute
  >,
) => {
  console.dir(tracks, { depth: 20 });
  return (
    <div className="m-6 ">
      Total: {total}
      {tracks?.map((t) => (
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
