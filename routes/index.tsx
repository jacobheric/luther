import { Search } from "@/islands/search.tsx";
import { Tracks } from "@/islands/tracks.tsx";
import { getSongs } from "@/lib/ai/ai.ts";
import { searchSongs } from "@/lib/spotify/api.ts";
import { define } from "@/lib/state.ts";
import { type Track } from "@spotify/web-api-ts-sdk";
import { page, PageProps } from "fresh";
import { TEST_SONGS } from "@/lib/config.ts";
import { testSongs } from "@/lib/test/data.ts";

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
      return page({ prompt, mode, error: NOT_FOUND });
    }

    const songs = await searchSongs(rawSongs);

    if (!songs || songs.length === 0) {
      return page({ prompt, mode, error: NOT_FOUND });
    }

    return page({ prompt, songs, mode });
  },
  GET() {
    if (TEST_SONGS) {
      return page(
        { prompt: "tom petty deep cuts", songs: testSongs } as SearchType,
      );
    }
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
