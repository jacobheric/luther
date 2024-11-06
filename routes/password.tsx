import { define } from "@/lib/state.ts";
import { AuthError } from "@supabase/supabase-js";
import { page, PageProps } from "fresh";

export const handler = define.handlers({
  POST() {
    return page();
  },
  GET() {
    return page();
  },
});

export default function Password(
  { data }: PageProps<{ error?: AuthError }>,
) {
  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6 prose">
      {data?.error && <p class="text-red-500">{data?.error?.message}</p>}
      <form method="post">
        <div class="flex flex-col gap-4">
          <label for="password">Password</label>
          <input
            className="border border-gray-200 p-3 rounded-m w-full"
            type="password"
            name="password"
            required
          />
          <button
            className={`border border-gray-200 bg-gray-100 p-3 rounded-m `}
            type="submit"
          >
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
