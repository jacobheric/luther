export const LoginForm = ({ error }: { error?: string }) => {
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
          <button type="submit">
            Login
          </button>
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
