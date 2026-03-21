import { createBrowserNeonAuthClient } from "@/lib/auth_client.ts";
import { useEffect, useState } from "preact/hooks";

const SESSION_VERIFIER_PARAM = "neon_auth_session_verifier";

type CallbackState = {
  authUrl: string;
  error?: string;
};

export const LoginCallback = (
  { authUrl, error: initialError }: CallbackState,
) => {
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (initialError) {
      return;
    }

    const completeLogin = async () => {
      const auth = createBrowserNeonAuthClient(authUrl);
      const hasVerifier = new URLSearchParams(globalThis.location.search).has(
        SESSION_VERIFIER_PARAM,
      );

      if (!hasVerifier) {
        setError("Missing Neon session verifier on the OAuth callback URL.");
        return;
      }

      const { data, error: authError } = await auth.getSession({
        query: {
          disableCookieCache: true,
        },
      });

      if (authError || !data?.session) {
        setError(authError?.message ?? "Failed to complete Google login.");
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
        setError(body.error ?? "Failed to create an app session.");
        return;
      }

      const body = await response.json();
      globalThis.location.href = body.redirectTo ?? "/";
    };

    void completeLogin();
  }, [authUrl, initialError]);

  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6">
      <div class="prose dark:prose-invert">
        {error
          ? (
            <>
              <p>{error}</p>
              <p>
                <a href="/login">Back to login</a>
              </p>
            </>
          )
          : <p>Finishing Google login...</p>}
      </div>
    </div>
  );
};
