import { type AppSession } from "@/lib/auth.ts";
import { Search } from "@/islands/search.tsx";
import { Tracks } from "@/islands/tracks.tsx";
import { TEST_MODE } from "@/lib/config.ts";

import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { getSearchHistory, type SearchHistoryRow } from "@/lib/db/history.ts";

export type History = SearchHistoryRow;

type IndexType = {
  testMode?: boolean;
  history?: History[];
};

const history = async (test: boolean, session?: AppSession) => {
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
