import { Search } from "@/islands/search.tsx";
import { Tracks } from "@/islands/tracks.tsx";
import { TEST_MODE } from "@/lib/config.ts";

import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { getSearchHistory } from "@/lib/db/history.ts";
import { Session } from "@supabase/supabase-js";

export type History = {
  id: number;
  search: string;
  created_at: string;
};

type IndexType = {
  testMode?: boolean;
  history?: History[];
};

const history = async (test: boolean, session?: Session) => {
  if (test || !session) {
    return [];
  }
  return await getSearchHistory(session);
};

export const handler = define.handlers<
  IndexType | undefined
>({
  async POST(ctx) {
    return page({
      testMode: TEST_MODE,
      history: await history(TEST_MODE, ctx.state.session),
    });
  },
  async GET(ctx) {
    return page(
      {
        testMode: TEST_MODE,
        history: await history(TEST_MODE, ctx.state.session),
      },
    );
  },
});

const Index = (
  { data }: PageProps<IndexType>,
) => {
  return (
    <div className="flex flex-col w-full">
      <Search test={data?.testMode} history={data?.history} />
      <Tracks test={data?.testMode} />
    </div>
  );
};

export default Index;
