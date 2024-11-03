import { FreshContext } from "fresh";

import "@std/dotenv/load";
import {
  BASIC_AUTH_PASSWORD,
  BASIC_AUTH_USER,
  PRODUCTION,
} from "@/lib/config.ts";

const unrestricted = [
  "/about",
  "/spotify/login",
  "/api/spotify/refresh-token",
  "/api/spotify/access-token",
];

const authHandler = (
  ctx: FreshContext,
) => {
  const url = new URL(ctx.req.url);

  if (!PRODUCTION) {
    return ctx.next();
  }

  if (
    unrestricted.some((route) => url.pathname.startsWith(route))
  ) {
    return ctx.next();
  }

  if (
    ctx.req.headers.get("Authorization") !==
      `Basic ${btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)}`
  ) {
    const headers = new Headers({
      "WWW-Authenticate": 'Basic realm="Listen to Luther"',
    });
    return new Response("Unauthorized", { status: 401, headers });
  }

  return ctx.next();
};

export const handler = [authHandler];
