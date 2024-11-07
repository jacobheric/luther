import {
  CLOUDFLARE_TURNSTILE_SECRET_KEY,
  CLOUDFLARE_TURNSTILE_SITE_KEY,
  INVITE_EMAIL_ADDRESS,
  RESEND_API_KEY,
} from "@/lib/config.ts";
import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { Resend } from "resend";

export const handler = define.handlers({
  async POST(ctx) {
    ctx.state.script = "https://challenges.cloudflare.com/turnstile/v0/api.js";

    const form = await ctx.req.formData();
    const email = form.get("email")?.toString();
    const token = form.get("cf-turnstile-response")?.toString();
    const ip = ctx.req.headers.get("X-Forwarded-For") || "localhost";

    if (!email || !token || !ip) {
      return page({
        error: new Error("You must supply an email and verify you are human."),
      });
    }

    const formData = new FormData();
    formData.append("secret", CLOUDFLARE_TURNSTILE_SECRET_KEY!);
    formData.append("response", token);
    formData.append("remoteip", ip);

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(url, {
      body: formData,
      method: "POST",
    });

    const outcome = await result.json();
    if (!outcome.success) {
      return page({
        error: new Error("This is for humans"),
      });
    }

    const resend = new Resend(RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "Listen to Luther <luther@listentoluther.com>",
      to: [INVITE_EMAIL_ADDRESS!],
      subject: "Invitation Request",
      html: `${email} wants to join Listen to Luther`,
    });

    if (error) {
      return page({
        error: new Error("Failed to send invitation, please try again later."),
      });
    }

    return page({ siteKey: CLOUDFLARE_TURNSTILE_SITE_KEY, success: true });
  },
  GET(ctx) {
    ctx.state.script = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    return page({ siteKey: CLOUDFLARE_TURNSTILE_SITE_KEY });
  },
});

export default function Login(
  { data }: PageProps<{ success?: boolean; error?: Error; siteKey: string }>,
) {
  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6 prose">
      <div>
        Listen to Luther is still learning to get his groove on. Sign up and
        we'll send you an invite when he's fully rockin'.
      </div>
      {data?.error && <p class="text-red-500">{data?.error?.message}</p>}
      {data?.success && <p>Invitation sent! We'll get back to you shortly.</p>}
      <form method="post">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col">
            <label for="email">Email</label>
            <input
              className="border border-gray-200 p-3 rounded-m "
              type="email"
              name="email"
              required
            />
          </div>
          {
            /* <div class="flex flex-col">
            <label for="password">Password</label>
            <input
              className="border border-gray-200 p-3 rounded-m sm:-[90%] md:w-[586px]"
              type="password"
              name="password"
              required
            />
          </div> */
          }

          <button
            className={`border border-gray-200 bg-gray-100 p-3 rounded-m `}
            type="submit"
          >
            Sign up
          </button>
          <div
            class="cf-turnstile w-full text-center mx-auto"
            data-sitekey={data.siteKey}
          />
        </div>
      </form>
    </div>
  );
}