import { deleteCookie, getCookies, setCookie } from "@std/http/cookie";

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

export const getSessionUserId = (session: AppSession) => {
  const userId = session.user?.id;

  if (!userId) {
    throw new Error("Authenticated session is missing a user id");
  }

  return userId;
};

type SessionTokens = Pick<AppSession, "access_token" | "refresh_token">;

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
