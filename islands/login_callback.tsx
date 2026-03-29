import { createBrowserNeonAuthClient } from "@/lib/auth_client.ts";
import { useEffect, useState } from "preact/hooks";
import Loader2 from "tabler-icons/tsx/loader-2.tsx";
import { AuthShell } from "@/components/auth_shell.tsx";

const SESSION_VERIFIER_PARAM = "neon_auth_session_verifier";

type CallbackState = {
  authUrl: string;
  error?: string;
};

type LoginStatus = "loading" | "error";

const getRedirectPath = () => {
  const currentUrl = new URL(globalThis.location.href);
  return currentUrl.searchParams.get("redirect") ?? "/";
};

export const LoginCallback = (
  { authUrl, error: initialError }: CallbackState,
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
      const redirect = getRedirectPath();
      const loginUrl = `/login?redirect=${encodeURIComponent(redirect)}`;
      const auth = createBrowserNeonAuthClient(authUrl);
      const hasVerifier = currentUrl.searchParams.has(SESSION_VERIFIER_PARAM);

      const { data, error: authError } = await auth.getSession();

      if (authError || !data?.session || !data?.user) {
        if (!hasVerifier) {
          globalThis.location.href = loginUrl;
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
      globalThis.location.href = body.redirectTo ?? "/";
    };

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [authUrl, initialError]);

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
            <a href="/login" class="text-sm">
              Back to login
            </a>
          </div>
        )
        : (
          <div class="flex flex-row items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Loader2 class="w-4 h-4 animate-spin shrink-0" />
            <span>Completing Google sign-in...</span>
          </div>
        )}
    </AuthShell>
  );
};
