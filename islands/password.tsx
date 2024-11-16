import { IS_BROWSER } from "fresh/runtime";
import { useEffect } from "preact/hooks";
export default function Password(
  { error, success }: { error?: string; success?: boolean },
) {
  let token = "";
  let refreshToken = "";
  if (IS_BROWSER) {
    const url = new URLSearchParams(globalThis.location.hash.slice(1));
    token = url.get("access_token") || "";
    refreshToken = url.get("refresh_token") || "";
  }

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        globalThis.location.href = "/login";
      }, 3000);
    }
  }, [success]);

  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6 ">
      <div className="prose dark:prose-invert">
        Set your password to get started. Next you'll use that and the email you
        signed up with to login.
        {error && <p class="text-red-500">{error}</p>}
        {success && <p>Password set successfully! Redirecting to login...</p>}
      </div>

      <form method="post">
        <div class="flex flex-col gap-4">
          <label for="password">Password</label>

          <input
            type="hidden"
            name="token"
            value={token}
          />

          <input
            type="hidden"
            name="refreshToken"
            value={refreshToken}
          />

          <input
            type="password"
            name="password"
            required
          />
          <button type="submit">
            Set Password
          </button>
          <div className="flex flex-row justify-start items-center gap-2 tracking-wide underline-offset-4">
            <a href="/login">login</a>
            <a href="/signup">signup</a>
          </div>
        </div>
      </form>
    </div>
  );
}
