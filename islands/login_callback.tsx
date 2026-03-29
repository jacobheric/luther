import { createBrowserNeonAuthClient } from "@/lib/auth_client.ts";
import { useEffect, useState } from "preact/hooks";
import Loader2 from "tabler-icons/tsx/loader-2.tsx";
import { AuthShell } from "@/components/auth_shell.tsx";

const SESSION_VERIFIER_PARAM = "neon_auth_session_verifier";

type CallbackState = {
  authUrl: string;
  error?: string;
  redirect: string;
};

type LoginStatus = "loading" | "error";

export const LoginCallback = (
  { authUrl, error: initialError, redirect }: CallbackState,
) => {
  const [status, setStatus] = useState<LoginStatus>(
    initialError ? "error" : "loading",
  );
  const [error, setError] = useState(initialError ?? null);

  useEffect(() => {
    if (initialError) {
      return;
    }

    let cancelled = false;

    const fail = (message: string) => {
      if (cancelled) {
        return;
      }

      setStatus("error");
      setError(message);
    };

    const completeLogin = async () => {
      const currentUrl = new URL(globalThis.location.href);
      const loginUrl = `/login?redirect=${encodeURIComponent(redirect)}`;
      const auth = createBrowserNeonAuthClient(authUrl);
      const hasVerifier = currentUrl.searchParams.has(SESSION_VERIFIER_PARAM);

      const { data, error: authError } = await auth.getSession();

      if (authError || !data?.session || !data?.user) {
        if (!hasVerifier) {
          globalThis.location.replace(loginUrl);
          return;
        }

        fail(authError?.message ?? "Failed to complete Google login.");
        return;
      }

      const response = await fetch(globalThis.location.href, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: undefined }));
        fail(body.error ?? "Failed to create an app session.");
        return;
      }

      const body = await response.json();
      globalThis.location.replace(body.redirectTo ?? "/");
    };

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [authUrl, initialError, redirect]);

  const restartUrl = `/login?redirect=${encodeURIComponent(redirect)}`;

  return (
    <AuthShell
      title={status === "error" ? "Sign-in failed" : "Signing you in"}
      body={status === "error"
        ? "The Google login could not be completed."
        : "Finalizing your session and sending you back into the app."}
    >
      {status === "error"
        ? (
          <div class="flex flex-col gap-4">
            <p class="text-sm text-red-500">{error}</p>
            <div class="flex flex-row flex-wrap gap-3 text-sm">
              <a href={restartUrl}>Start over</a>
              <a href="/logout">Logout</a>
            </div>
          </div>
        )
        : (
          <div class="flex flex-col gap-4">
            <div class="flex flex-row items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Loader2 class="w-4 h-4 animate-spin shrink-0" />
              <span>Completing Google sign-in...</span>
            </div>
          </div>
        )}
    </AuthShell>
  );
};
