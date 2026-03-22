import { createAuthClient } from "@neondatabase/auth";

export const createBrowserNeonAuthClient = (authUrl: string) =>
  createAuthClient(authUrl);
