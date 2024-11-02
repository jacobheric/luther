import { setCookie } from "@std/http/cookie";

export const spotifyToken = async (origin: string, rawToken: string) => {
  const token = JSON.parse(
    decodeURIComponent(rawToken),
  );

  if (!token.expires_at || Date.now() >= token.expires_at) {
    const response = await fetch(
      `${origin}/api/spotify/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: token.refresh_token }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return await response.json();
  }

  return token;
};

export type TokenData = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export const setTokenCookie = (headers: Headers, tokenData: TokenData) =>
  setCookie(headers, {
    name: "spotifyToken",
    path: "/",
    value: encodeURIComponent(JSON.stringify(tokenData)),
    maxAge: 400 * 24 * 60 * 60,
  });
