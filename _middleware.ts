import { FreshContext } from "fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";

const spotifyExcludes = [
  "/spotify",
  "/api/spotify-token",
];

const spotifyTokenHandler = (
  req: Request,
  ctx: FreshContext,
) => {
  const { pathname } = new URL(req.url);

  if (
    ctx.destination !== "route" ||
    spotifyExcludes.some((route) => pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  if (!getCookies(req.headers).spotifyToken) {
    return new Response(null, {
      status: 307,
      headers: { Location: "/spotify/login" },
    });
  }

  return ctx.next();
};

export const handler = [spotifyTokenHandler];
