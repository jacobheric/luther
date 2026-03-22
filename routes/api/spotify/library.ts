import { define } from "@/lib/state.ts";
import { saveItemToLibrary } from "@/lib/spotify/api.ts";

const toUri = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json().catch(() => null) as
      | { uri?: unknown }
      | null;
    const uri = toUri(body?.uri);

    if (!uri) {
      return Response.json({ error: "Missing Spotify URI." }, { status: 400 });
    }

    try {
      await saveItemToLibrary(ctx.state.spotifyToken, uri);
      return new Response(null, { status: 204 });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to save item to library.";
      const isScopeIssue = message.includes("SPOTIFY_SCOPE_FORBIDDEN");
      return Response.json(
        {
          error: isScopeIssue
            ? "Spotify authorization is missing library-write scope. Please reauthorize."
            : "Failed to save item to library.",
        },
        { status: isScopeIssue ? 403 : 500 },
      );
    }
  },
});
