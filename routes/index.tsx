import { Go } from "@/islands/go.tsx";
import { Tracks } from "@/islands/tracks.tsx";
import { getSongs } from "@/lib/openai.ts";
import { searchSongs } from "@/lib/spotify.ts";
import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { type Track } from "@spotify/web-api-ts-sdk";

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

    const songs = await searchSongs(rawSongs);
    return page({ prompt, songs });
  },
  GET() {
    return page();
  },
});

const Index = (
  { data }: PageProps<{ prompt: string; songs: Track[] }>,
) => {
  return (
    <div className="flex flex-col w-full">
      <form method="post" id="prompt">
        <div className="mx-auto mt-12 flex flex-row justify-center items-center gap-2">
          <input
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
