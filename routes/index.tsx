import { Search } from "@/islands/search.tsx";
import { Tracks } from "@/islands/tracks.tsx";
import { TEST_MODE } from "@/lib/config.ts";

import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";

type IndexType = {
  TEST_MODE?: boolean;
};

export const handler = define.handlers<
  IndexType | undefined
>({
  GET() {
    if (TEST_MODE) {
      return page(
        { TEST_MODE: true } as IndexType,
      );
    }
    return page();
  },
});

const Index = (
  { data }: PageProps<IndexType>,
) => {
  return (
    <div className="flex flex-col w-full">
      <Search test={data?.TEST_MODE} />
      <Tracks test={data?.TEST_MODE} />
    </div>
  );
};

export default Index;
