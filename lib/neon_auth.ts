import { NEON_AUTH_URL, NEON_DATABASE_URL } from "@/lib/config.ts";

const normalizeAuthUrl = (value: string) =>
  value
    .replace(".neon.build/", ".neon.tech/")
    .replace(/\/$/, "");

const deriveNeonAuthUrl = (databaseUrl: string) => {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");
  const [rawEndpoint, ...hostParts] = url.hostname.split(".");

  if (!rawEndpoint || hostParts.length === 0 || !database) {
    throw new Error("NEON_DATABASE_URL is invalid");
  }

  const endpoint = rawEndpoint.replace(/-pooler$/, "");
  const hostSuffix = hostParts.join(".");

  return normalizeAuthUrl(
    `https://${endpoint}.neonauth.${hostSuffix}/${database}/auth`,
  );
};

export const getNeonAuthUrl = () => {
  if (NEON_AUTH_URL) {
    return normalizeAuthUrl(NEON_AUTH_URL);
  }

  if (!NEON_DATABASE_URL) {
    throw new Error("NEON_AUTH_URL or NEON_DATABASE_URL must be set");
  }

  return deriveNeonAuthUrl(NEON_DATABASE_URL);
};
