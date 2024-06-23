import { Handlers } from "$fresh/src/server/types.ts";

export const handler: Handlers = {
  GET(_req) {
    return new Response("", {
      status: 307,
      headers: { Location: "/tracks" },
    });
  },
};

const Index = () => {
  return null; //nothing here yet
};

export default Index;
