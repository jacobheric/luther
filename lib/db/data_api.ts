import type { AppSession } from "@/lib/auth.ts";
import { getNeonDataApiUrl } from "@/lib/neon_auth.ts";
import {
  fetchWithToken,
  NeonPostgrestClient,
} from "@neondatabase/postgrest-js";

const createSessionFetch = (session: AppSession) =>
  fetchWithToken(() => Promise.resolve(session.access_token));

export const createNeonDataApiClient = (session: AppSession) =>
  new NeonPostgrestClient({
    dataApiUrl: getNeonDataApiUrl(),
    options: {
      db: { schema: "public" },
      global: { fetch: createSessionFetch(session) },
    },
  });
