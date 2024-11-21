import { define } from "@/lib/state.ts";
import { page, PageProps } from "fresh";
import { Resend } from "resend";
import { ME_EMAIL, RESEND_API_KEY } from "@/lib/config.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const feedback = form.get("feedback")?.toString();

    if (!feedback) {
      return page({
        error: new Error("No feedback provided."),
      });
    }

    const resend = new Resend(RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "Listen to Luther <luther@listentoluther.com>",
      to: [ME_EMAIL!],
      subject: "Feedback",
      html: feedback,
    });

    if (error) {
      console.error("failed to send feedback", error);
      return page({
        error: new Error("Failed to send feedback, please try again later."),
      });
    }

    return page({ success: true });
  },
});

export default function Help(
  { data }: PageProps<{ success?: boolean; error?: Error }>,
) {
  return (
    <div class="flex flex-col gap-4 justify-start my-12 w-[586px] mx-6">
      {data?.error && <p class="text-red-500">{data?.error?.message}</p>}
      {data?.success && <p>Feedback sent! Thanks for doing that!</p>}

      <form method="post">
        <div class="flex flex-col gap-4">
          <label for="feedback">Feedback</label>
          <textarea
            id="feedback"
            name="feedback"
            required
          />

          <button type="submit">
            Send Feedback
          </button>
        </div>
      </form>
    </div>
  );
}
