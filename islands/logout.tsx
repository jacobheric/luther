import { createBrowserNeonAuthClient } from "@/lib/auth_client.ts";
import { useEffect, useState } from "preact/hooks";
import Loader2 from "tabler-icons/tsx/loader-2.tsx";
import { AuthShell } from "@/components/auth_shell.tsx";

export const LogoutPage = ({ authUrl }: { authUrl: string }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const completeLogout = async () => {
      try {
        const auth = createBrowserNeonAuthClient(authUrl);
        await auth.signOut();
      } catch (logoutError) {
        console.error("failed signing out of neon auth", logoutError);
      }

      try {
        const response = await fetch("/logout", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`logout failed with status ${response.status}`);
        }

        globalThis.location.href = "/login";
      } catch (requestError) {
        console.error("failed clearing app session", requestError);

        if (!cancelled) {
          setError(
            "Could not finish logging out. Please refresh and try again.",
          );
        }
      }
    };

    void completeLogout();

    return () => {
      cancelled = true;
    };
  }, [authUrl]);

  return (
    <AuthShell
      title={error ? "Sign-out failed" : "Signing you out"}
      body={error
        ? "Your session could not be cleared cleanly."
        : "Clearing your session and taking you back to login."}
    >
      {error
        ? <p class="text-sm text-red-500">{error}</p>
        : (
          <div class="flex flex-row items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Loader2 class="w-4 h-4 animate-spin shrink-0" />
            <span>Signing you out...</span>
          </div>
        )}
    </AuthShell>
  );
};
