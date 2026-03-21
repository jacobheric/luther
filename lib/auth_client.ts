import { createAuthClient } from "@neondatabase/neon-js/auth";

export const createBrowserNeonAuthClient = (authUrl: string) =>
  createAuthClient(authUrl);
