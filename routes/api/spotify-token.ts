import { Handlers } from "$fresh/server.ts";
import { AccessToken } from "npm:@spotify/web-api-ts-sdk";

import { signal } from "@preact/signals";

export const spotifyToken = signal<AccessToken | null>(null);

export const handler: Handlers = {
  async POST(req, _ctx) {
    console.log("shit handling auth token");
    spotifyToken.value = await req.json();

    console.log("shit auth token", spotifyToken.value);

    if (!spotifyToken.value) {
      console.log("token not found");
      return new Response();
    }

    return new Response("", {
      status: 307,
      headers: { Location: "/tracks" },
    });
  },
};
