import { useState } from "preact/hooks";

const getNeonCallbackOrigin = (origin: string) => {
  const url = new URL(origin);

  //
  // Spotify uses 127.0.0.1 for local callbacks, so Neon must use
  // the same loopback host to keep auth cookies on one host.
  if (url.hostname === "localhost" || url.hostname === "::1") {
    url.hostname = "127.0.0.1";
  }

  return url.origin;
};

export const LoginForm = (
  { authUrl, error, redirect }: {
    authUrl: string;
    error?: string;
    redirect: string;
  },
) => {
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState<string>();

  const login = async () => {
    setLoading(true);
    setClientError(undefined);

    const callback = new URL(
      "/login/callback",
      getNeonCallbackOrigin(globalThis.location.origin),
    );
    callback.searchParams.set("redirect", redirect);

    const response = await fetch(`${authUrl}/sign-in/social`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        provider: "google",
        callbackURL: callback.toString(),
        disableRedirect: true,
      }),
    });

    const body = await response.json().catch(() => ({
      error: "Login failed.",
    }));

    if (!response.ok || !body.url) {
      setLoading(false);
      setClientError(body.error ?? body.message ?? "Login failed.");
      return;
    }

    globalThis.location.href = body.url;
  };

  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6">
      {error && <p class="text-red-500">{error}</p>}
      {clientError && <p class="text-red-500">{clientError}</p>}
      <div class="flex flex-col gap-4">
        <div class="prose dark:prose-invert">
          Sign in with the Google account that has been approved for Luther.
        </div>
        <button disabled={loading} onClick={login} type="button">
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
};
