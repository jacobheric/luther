import { useState } from "preact/hooks";
import Loader2 from "tabler-icons/tsx/loader-2.tsx";
import { AuthShell } from "@/components/auth_shell.tsx";

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
    <AuthShell
      title={loading ? "Redirecting to Google" : "Sign in to Luther"}
    >
      <div class="flex flex-col gap-4">
        {error && <p class="text-sm text-red-500">{error}</p>}
        {clientError && <p class="text-sm text-red-500">{clientError}</p>}
        <button
          class="cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          disabled={loading}
          onClick={login}
          type="button"
        >
          {loading && <Loader2 class="w-4 h-4 animate-spin shrink-0" />}
          <span>{loading ? "Redirecting..." : "Continue with Google"}</span>
        </button>
      </div>
    </AuthShell>
  );
};
