import { useState } from "preact/hooks";

export const LoginForm = ({ error }: { error?: string }) => {
  const [accepted, setAccepted] = useState(true);
  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6">
      {error && <p class="text-red-500">{error}</p>}
      <form method="post">
        <div class="flex flex-col gap-4">
          <label for="email">Email</label>
          <input
            type="email"
            name="email"
            required
          />

          <label for="password">Password</label>
          <input
            type="password"
            name="password"
            required
          />
          <button type="submit" disabled={!accepted}>
            Login
          </button>
          <div class="flex flex-row gap-1 items-center justify-start">
            <input
              type="checkbox"
              checked={accepted}
              onChange={() => setAccepted(!accepted)}
              class="w-4 h-4 accent-gray-500"
            />
            I accept the
            <a
              class="underline-offset-4"
              href="/policies#eula"
            >
              user agreement
            </a>
            &
            <a
              class="underline-offset-4"
              href="/policies#privacy-policy"
            >
              privacy policy
            </a>
          </div>
          <div>
            <a className="underline-offset-4" href="/signup">
              signup
            </a>
          </div>
        </div>
      </form>
    </div>
  );
};
