import { TEST_MODE } from "@/lib/config.ts";

import { getSearchHistory } from "@/lib/db/history.ts";
import { define } from "@/lib/state.ts";
import { Session } from "@supabase/supabase-js";
import { page, PageProps } from "fresh";

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
  console.log(data);
  return (
    <div className="flex flex-col w-full">
      test
    </div>
  );
};

export default Index;
