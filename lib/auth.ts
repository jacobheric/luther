import { deleteCookie, getCookies, setCookie } from "@std/http/cookie";
import { ALLOWED_USER_EMAILS } from "@/lib/config.ts";
import { sql } from "@/lib/db/sql.ts";

const SESSION_COOKIE = "luther-session";
const LOGIN_FLOW_COOKIE = "luther-login-flow";
const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const LOGIN_FLOW_MAX_AGE_SECONDS = 10 * 60;
const SESSION_RENEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type AppUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type AppSession = {
  user: AppUser;
  expires_at: string;
};

export type LoadedAuthSession = {
  session: AppSession;
  token: string;
  shouldPersist: boolean;
};

type StoredSessionRow = {
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  expires_at: string | Date;
};

const allowedEmails = new Set(
  (ALLOWED_USER_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
);

const encoder = new TextEncoder();
let ensureAppSessionsTablePromise: Promise<void> | null = null;

const firstNonEmpty = (values: unknown[]) =>
  values.find((value): value is string =>
    typeof value === "string" && value.trim().length > 0
  )?.trim() ?? "";

const isSecureCookie = (url: URL) => url.protocol === "https:";

const toIsoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const getCookieToken = (req: Request, name: string) =>
  getCookies(req.headers)[name];

const setSessionCookie = (
  headers: Headers,
  url: URL,
  token: string,
) =>
  setCookie(headers, {
    name: SESSION_COOKIE,
    value: token,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: isSecureCookie(url),
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });

const setLoginFlowCookie = (headers: Headers, url: URL) =>
  setCookie(headers, {
    name: LOGIN_FLOW_COOKIE,
    value: "1",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: isSecureCookie(url),
    maxAge: LOGIN_FLOW_MAX_AGE_SECONDS,
  });

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const generateSessionToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
};

const hashSessionToken = async (token: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return toHex(new Uint8Array(digest));
};

const buildAppSession = (row: StoredSessionRow): AppSession => ({
  user: {
    id: row.user_id,
    email: row.user_email,
    name: row.user_name,
  },
  expires_at: toIsoString(row.expires_at),
});

const getVerifiedSessionToken = (payload: Record<string, unknown>) => {
  const session = payload.session as Record<string, unknown> | undefined;

  return firstNonEmpty([
    session?.token,
    session?.access_token,
    payload.access_token,
  ]);
};

const getVerifiedUser = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as {
    user?: {
      id?: unknown;
      email?: unknown;
      name?: unknown;
    };
  };
  const id = firstNonEmpty([data.user?.id]);

  if (!id) {
    return null;
  }

  return {
    id,
    email: typeof data.user?.email === "string" ? data.user.email : null,
    name: typeof data.user?.name === "string" ? data.user.name : null,
  } satisfies AppUser;
};

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

export const clearAuthCookies = (headers: Headers) => {
  deleteCookie(headers, SESSION_COOKIE, { path: "/" });
  deleteCookie(headers, LOGIN_FLOW_COOKIE, { path: "/" });
};

export const persistAuthSession = (
  headers: Headers,
  url: URL,
  token: string,
) => {
  setSessionCookie(headers, url, token);
};

export const persistLoginFlow = (headers: Headers, url: URL) => {
  setLoginFlowCookie(headers, url);
};

export const hasLoginFlow = (req: Request) =>
  getCookieToken(req, LOGIN_FLOW_COOKIE) === "1";

export const clearLoginFlow = (headers: Headers) => {
  deleteCookie(headers, LOGIN_FLOW_COOKIE, { path: "/" });
};

const ensureAppSessionsTable = async () => {
  if (!ensureAppSessionsTablePromise) {
    ensureAppSessionsTablePromise = (async () => {
      await sql`
        create table if not exists public.app_sessions (
          token_hash text primary key,
          user_id uuid not null references neon_auth.user(id) on delete cascade,
          user_email text,
          user_name text,
          expires_at timestamptz not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          last_seen_at timestamptz not null default now()
        )
      `;

      await sql`
        create index if not exists app_sessions_user_id_idx
          on public.app_sessions (user_id)
      `;
    })();
  }

  await ensureAppSessionsTablePromise;
};

export const createAuthSession = async (
  headers: Headers,
  url: URL,
  user: AppUser,
) => {
  await ensureAppSessionsTable();

  const token = generateSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(Date.now() + (AUTH_COOKIE_MAX_AGE_SECONDS * 1000));

  await sql`
    insert into public.app_sessions (
      token_hash,
      user_id,
      user_email,
      user_name,
      expires_at
    )
    values (
      ${tokenHash},
      ${user.id},
      ${user.email ?? null},
      ${user.name ?? null},
      ${expiresAt.toISOString()}
    )
  `;

  persistAuthSession(headers, url, token);

  return {
    user,
    expires_at: expiresAt.toISOString(),
  } satisfies AppSession;
};

export const getAuthSession = async (
  req: Request,
): Promise<LoadedAuthSession | null> => {
  await ensureAppSessionsTable();

  const token = getCookieToken(req, SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const tokenHash = await hashSessionToken(token);
  const [row] = await sql<StoredSessionRow[]>`
    select user_id, user_email, user_name, expires_at
    from public.app_sessions
    where token_hash = ${tokenHash}
    limit 1
  `;

  if (!row) {
    return null;
  }

  const now = Date.now();
  const expiresAt = new Date(row.expires_at);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now) {
    await sql`
      delete from public.app_sessions
      where token_hash = ${tokenHash}
    `;
    return null;
  }

  let shouldPersist = false;
  let nextExpiresAt = expiresAt;

  if ((expiresAt.getTime() - now) <= SESSION_RENEW_WINDOW_MS) {
    nextExpiresAt = new Date(
      Date.now() + (AUTH_COOKIE_MAX_AGE_SECONDS * 1000),
    );
    shouldPersist = true;

    await sql`
      update public.app_sessions
      set
        user_email = ${row.user_email},
        user_name = ${row.user_name},
        expires_at = ${nextExpiresAt.toISOString()},
        updated_at = now(),
        last_seen_at = now()
      where token_hash = ${tokenHash}
    `;
  }

  return {
    token,
    shouldPersist,
    session: {
      ...buildAppSession(row),
      expires_at: nextExpiresAt.toISOString(),
    },
  };
};

export const revokeAuthSession = async (headers: Headers, req: Request) => {
  await ensureAppSessionsTable();

  const token = getCookieToken(req, SESSION_COOKIE);
  clearAuthCookies(headers);

  if (!token) {
    return;
  }

  const tokenHash = await hashSessionToken(token);
  await sql`
    delete from public.app_sessions
    where token_hash = ${tokenHash}
  `;
};

export const getCallbackUser = (payload: Record<string, unknown>) => {
  const token = getVerifiedSessionToken(payload);

  if (!token) {
    return null;
  }

  return getVerifiedUser(payload);
};
