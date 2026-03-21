import { NEON_AUTH_URL, NEON_DATA_API_URL } from "@/lib/config.ts";

const requireEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`${name} must be set`);
  }

  return value;
};

export const getNeonAuthUrl = () => requireEnv(NEON_AUTH_URL, "NEON_AUTH_URL");

export const getNeonDataApiUrl = () =>
  requireEnv(NEON_DATA_API_URL, "NEON_DATA_API_URL");
