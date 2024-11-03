import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { getSongs } from "@/lib/openai.ts";
import { searchSongs, spotifyToken } from "@/lib/spotify.ts";
import { getCookies } from "@std/http/cookie";
import { Tracks } from "@/islands/tracks.tsx";
import { SPOTIFY_CLIENT_ID } from "@/lib/config.ts";
import IconPencil from "tabler-icons/tsx/pencil.tsx";
import { Go } from "@/islands/go.tsx";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const prompt = form.get("prompt")?.toString();

    if (!prompt) {
      return page({ prompt, songs: [] });
    }

    const rawSongs = await getSongs(prompt);

    if (!rawSongs || rawSongs.length === 0) {
      return page({ prompt, songs: [] });
    }

    const rawToken = getCookies(ctx.req.headers).spotifyToken;
    const token = await spotifyToken(ctx.url.origin, rawToken);
    const songs = await searchSongs(token, rawSongs);

    return page({ prompt, songs });
  },
  GET(ctx) {
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

    return page();
  },
});

const Index = (
  { data }: PageProps<{ prompt: string; songs: any[] }>,
) => {
  return (
    <div className="flex flex-col w-[80%] mx-auto">
      <form method="post" id="prompt">
        <div className="mx-auto mt-12 flex flex-row justify-center items-center gap-2">
          <input
            className="border border-gray-200 p-3 rounded-m w-full"
            type="text"
            name="prompt"
            placeholder="what do you want to listen to?"
            defaultValue={data?.prompt}
            required
          />
          <Go />
        </div>
      </form>
      <Tracks tracks={data?.songs} />
    </div>
  );
};

export default Index;
