import { define } from "@/lib/state.ts";

export const handler = define.handlers({
  GET() {
    return new Response("", {
      status: 307,
      headers: { Location: "/tracks" },
    });
  },
});

const Index = () => {
  return null; //nothing here yet
};

export default Index;
