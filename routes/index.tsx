import { Search } from "@/islands/search.tsx";
import { Tracks } from "@/islands/tracks.tsx";
import { getSongs } from "@/lib/ai.ts";
import { searchSongs } from "@/lib/spotify/api.ts";
import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { type Track } from "@spotify/web-api-ts-sdk";

type SearchType = {
  prompt?: string;
  songs?: Track[];
  error?: string;
  mode?: string;
};
const NOT_FOUND = "No songs found, try adjusting your prompt.";

export const handler = define.handlers<
  SearchType | undefined
>({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const prompt = form.get("prompt")?.toString();
    const mode = form.get("mode")?.toString();

    if (!prompt) {
      return page({ prompt, songs: [] });
    }

    const rawSongs = await getSongs(prompt, mode);

    if (!rawSongs || rawSongs.length === 0) {
      return page({ prompt, moerror: NOT_FOUND });
    }

    const songs = await searchSongs(ctx.state.spotifyToken, rawSongs);

    if (!songs || songs.length === 0) {
      return page({ prompt, mode, error: NOT_FOUND });
    }

    return page({ prompt, songs, mode });
  },
  GET() {
    return page();
  },
});

const Index = (
  { data }: PageProps<SearchType | undefined>,
) => {
  return (
    <div className="flex flex-col w-full">
      <form method="post" id="promptForm">
        <Search prompt={data?.prompt} mode={data?.mode} />
      </form>
      {data?.error && (
        <div class="prose dark:prose-invert my-6">
          {data.error}
        </div>
      )}
      <Tracks tracks={data?.songs} />
    </div>
  );
};

export default Index;
