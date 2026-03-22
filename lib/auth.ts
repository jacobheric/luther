import { deleteCookie, getCookies, setCookie } from "@std/http/cookie";
import { createAuthClient } from "@neondatabase/auth";
import { ALLOWED_USER_EMAILS } from "@/lib/config.ts";
import { getNeonAuthUrl } from "@/lib/neon_auth.ts";

const ACCESS_TOKEN_COOKIE = "luther-access-token";
const REFRESH_TOKEN_COOKIE = "luther-refresh-token";
const USER_COOKIE = "luther-user";
const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export type AppUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type AppSession = {
  access_token: string;
  refresh_token: string;
  user: AppUser;
};

const JWT_EXPIRY_SKEW_MS = 30_000;
const allowedEmails = new Set(
  (ALLOWED_USER_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
);

export const getSessionUserId = (session: AppSession) => {
  const userId = session.user?.id;

  if (!userId) {
    throw new Error("Authenticated session is missing a user id");
  }

  return userId;
};

export const isAllowedUserEmail = (email?: string | null) => {
  if (allowedEmails.size === 0) {
    return true;
  }

  if (!email) {
    return false;
  }

  return allowedEmails.has(email.trim().toLowerCase());
};

type SessionTokens = Pick<AppSession, "access_token" | "refresh_token">;

const firstNonEmpty = (values: unknown[]) =>
  values.find((value): value is string =>
    typeof value === "string" && value.length > 0
  ) ?? "";

const getAuthTokens = (req: Request): SessionTokens | null => {
  const cookies = getCookies(req.headers);
  const accessToken = cookies[ACCESS_TOKEN_COOKIE];
  const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

  if (!accessToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

const isSecureCookie = (url: URL) => url.protocol === "https:";

const setAuthCookie = (
  headers: Headers,
  url: URL,
  name: string,
  value: string,
) =>
  setCookie(headers, {
    name,
    value,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: isSecureCookie(url),
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

export const clearAuthCookies = (headers: Headers) => {
  deleteCookie(headers, ACCESS_TOKEN_COOKIE, { path: "/" });
  deleteCookie(headers, REFRESH_TOKEN_COOKIE, { path: "/" });
  deleteCookie(headers, USER_COOKIE, { path: "/" });
};

export const persistAuthSession = (
  headers: Headers,
  url: URL,
  session: AppSession,
) => {
  setAuthCookie(headers, url, ACCESS_TOKEN_COOKIE, session.access_token);
  setAuthCookie(headers, url, REFRESH_TOKEN_COOKIE, session.refresh_token);
  setAuthCookie(
    headers,
    url,
    USER_COOKIE,
    encodeURIComponent(JSON.stringify(session.user)),
  );
};

export const getAuthSession = (req: Request) => {
  const tokens = getAuthTokens(req);
  const rawUser = getCookies(req.headers)[USER_COOKIE];

  if (!tokens || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(decodeURIComponent(rawUser)) as AppUser;

    if (!user?.id) {
      return null;
    }

    return {
      ...tokens,
      user,
    };
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token: string) => {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  const normalizedPayload = payload
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(payload.length / 4) * 4, "=");

  try {
    return JSON.parse(atob(normalizedPayload)) as { exp?: number };
  } catch {
    return null;
  }
};

export const isAccessTokenExpired = (
  session: AppSession,
  now: number = Date.now(),
) => {
  const payload = decodeJwtPayload(session.access_token);
  const expiryMs = payload?.exp ? payload.exp * 1000 : null;

  if (!expiryMs) {
    return false;
  }

  return now >= (expiryMs - JWT_EXPIRY_SKEW_MS);
};

const toRefreshedSession = (
  payload: unknown,
  previousSession: AppSession,
): AppSession | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybeData = payload as {
    session?: Record<string, unknown>;
    user?: Partial<AppUser>;
  };
  const maybeSession = maybeData.session ?? {};
  const accessToken = firstNonEmpty([
    maybeSession.access_token,
    maybeSession.token,
  ]);
  const refreshToken = firstNonEmpty([
    maybeSession.refresh_token,
    maybeSession.refreshToken,
    previousSession.refresh_token,
  ]);
  const userId = firstNonEmpty([
    maybeData.user?.id,
    previousSession.user?.id,
  ]);

  if (!accessToken || !userId) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: userId,
      email: maybeData.user?.email ?? previousSession.user?.email ?? null,
      name: maybeData.user?.name ?? previousSession.user?.name ?? null,
    },
  };
};

export const refreshAuthSession = async (session: AppSession) => {
  try {
    const auth = createAuthClient(getNeonAuthUrl());
    const refreshed = await auth.getSession({
      query: {
        disableCookieCache: true,
      },
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    });

    if (refreshed.error || !refreshed.data) {
      return null;
    }

    return toRefreshedSession(refreshed.data, session);
  } catch (error) {
    console.error("auth refresh failed", error);
    return null;
  }
};
