import { OPENAI_API_KEY } from "@/lib/config.ts";
import type { SongRecommendation } from "@/lib/chat/types.ts";
import { searchSong, type TrackLite } from "@/lib/spotify/api.ts";
import { getAppToken } from "@/lib/spotify/token.ts";
import OpenAI from "openai";
import type {
  Response,
  ResponseFunctionToolCall,
} from "openai/resources/responses/responses";

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const DEFAULT_SONGS_PER_TURN = 10;
const MAX_SONGS_PER_TURN = 20;
const MAX_CANDIDATE_SONGS_PER_TURN = 40;
const SPOTIFY_LOOKUP_CONCURRENCY = 5;

const buildSystemPrompt = (
  requestedSongCount: number,
  candidateSongCount: number,
) =>
  `You are Luther, a conversational AI DJ.

Respond conversationally in plain text in every turn.
When the user asks for songs, playlists, recommendations, more tracks, similar vibes,
or anything that implies track suggestions, you MUST call recommend_songs exactly once
with up to ${candidateSongCount} songs.
Do not output raw numbered song lists in text without also calling recommend_songs.
When recommending songs, target at least ${requestedSongCount} songs when possible.
If recommendations are not relevant, do not call recommend_songs.

Only include songs that are likely to exist on Spotify.
Favor specific tracks and artists over vague categories.`;

const TOOL_RESPONSE_PROMPT =
  `Write a brief conversational response (2-4 sentences) about this recommendation set.
Explain the vibe and why these tracks fit the request. Do not output a numbered song list.`;

const clampSongCount = (value: number) =>
  Math.max(1, Math.min(MAX_SONGS_PER_TURN, value));

const toRequestedSongCount = (message: string) => {
  const exactCountMatch = message.match(
    /\b(\d{1,2})\s+(?:more\s+)?(?:songs?|tracks?)\b/i,
  );

  if (exactCountMatch) {
    return clampSongCount(Number.parseInt(exactCountMatch[1], 10));
  }

  const moreCountMatch = message.match(/\b(\d{1,2})\s+more\b/i);

  if (moreCountMatch) {
    return clampSongCount(Number.parseInt(moreCountMatch[1], 10));
  }

  return DEFAULT_SONGS_PER_TURN;
};

const toCandidateSongCount = (requestedSongCount: number) =>
  Math.min(
    MAX_CANDIDATE_SONGS_PER_TURN,
    Math.max(requestedSongCount * 2, requestedSongCount + 8),
  );

const toNormalizedKey = (song: SongRecommendation) =>
  `${song.song.trim().toLowerCase()}::${song.artist.trim().toLowerCase()}`;

const toTrimmedString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toRecommendation = (value: unknown): SongRecommendation | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeSong = value as {
    song?: unknown;
    artist?: unknown;
    album?: unknown;
  };
  const song = toTrimmedString(maybeSong.song);
  const artist = toTrimmedString(maybeSong.artist);
  const album = toTrimmedString(maybeSong.album);

  if (!song || !artist) {
    return null;
  }

  return {
    song,
    artist,
    ...(album ? { album } : {}),
  };
};

const toRecommendationsFromArgs = (argumentsJson: string) => {
  try {
    const parsed = JSON.parse(argumentsJson) as {
      songs?: unknown[];
    };
    const songs = Array.isArray(parsed?.songs) ? parsed.songs : [];

    return songs
      .map(toRecommendation)
      .filter((song): song is SongRecommendation => song !== null);
  } catch {
    return [];
  }
};

const extractRecommendationCalls = (response: Response) =>
  response.output
    .filter((item): item is ResponseFunctionToolCall =>
      item.type === "function_call" && item.name === "recommend_songs"
    );

export const dedupeRecommendations = (songs: SongRecommendation[]) => {
  const seen = new Set<string>();

  return songs.filter((song) => {
    const key = toNormalizedKey(song);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const extractRecommendations = (
  response: Response,
  limit: number,
) => {
  const functionCalls = extractRecommendationCalls(response);

  const recommendations = functionCalls
    .flatMap((call) => toRecommendationsFromArgs(call.arguments));

  return dedupeRecommendations(recommendations).slice(0, limit);
};

const ackRecommendationToolCalls = async (
  response: Response,
) => {
  if (!openai) {
    throw new Error("OPENAI_API_KEY must be set");
  }

  const functionCalls = extractRecommendationCalls(response);

  if (functionCalls.length === 0) {
    return response;
  }

  const input = functionCalls.map((call) => ({
    type: "function_call_output" as const,
    call_id: call.call_id,
    output: JSON.stringify({
      songs: toRecommendationsFromArgs(call.arguments).slice(
        0,
        MAX_CANDIDATE_SONGS_PER_TURN,
      ),
    }),
  }));

  return await openai.responses.create({
    model: "gpt-5.4-mini",
    store: true,
    previous_response_id: response.id,
    instructions: TOOL_RESPONSE_PROMPT,
    input,
    max_output_tokens: 180,
  });
};

export const extractRecommendationsFromText = (text: string, limit: number) => {
  const recommendations = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): SongRecommendation | null => {
      const cleaned = line
        .replace(/^\d+[\).:\-\s]+/, "")
        .replace(/[“”]/g, '"')
        .trim();
      const match = cleaned.match(/^"?(.+?)"?\s*[—-]\s*(.+)$/);

      if (!match) {
        return null;
      }

      const song = match[1]?.trim();
      const artist = match[2]?.trim();

      if (!song || !artist) {
        return null;
      }

      return {
        song,
        artist,
        album: "",
      };
    })
    .filter((song): song is SongRecommendation => song !== null);

  return dedupeRecommendations(recommendations).slice(0, limit);
};

const mapWithConcurrency = async <T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
) => {
  const results: R[] = new Array(values.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, values.length)) },
    async () => {
      while (cursor < values.length) {
        const index = cursor++;
        results[index] = await mapper(values[index], index);
      }
    },
  );

  await Promise.all(workers);
  return results;
};

export const resolveRecommendedSongs = async (
  recommendations: SongRecommendation[],
  {
    maxResults = DEFAULT_SONGS_PER_TURN,
    excludeUris = [],
  }: {
    maxResults?: number;
    excludeUris?: string[];
  } = {},
) => {
  if (!recommendations.length) {
    return [];
  }

  const appToken = await getAppToken();

  const lookedUp = await mapWithConcurrency(
    recommendations,
    SPOTIFY_LOOKUP_CONCURRENCY,
    async (recommendation) =>
      await searchSong(appToken, {
        song: recommendation.song,
        artist: recommendation.artist,
        album: recommendation.album,
      }),
  );

  const seen = new Set<string>();
  const excluded = new Set(excludeUris);

  return lookedUp.reduce((songs, song) => {
    if (!song || seen.has(song.uri) || excluded.has(song.uri)) {
      return songs;
    }

    seen.add(song.uri);
    return songs.length >= maxResults ? songs : [...songs, song];
  }, [] as TrackLite[]).slice(0, maxResults);
};

export const streamAssistantTurn = async (
  {
    message,
    conversationId,
    previousResponseId,
    web,
    onDelta,
  }: {
    message: string;
    conversationId?: string | null;
    previousResponseId?: string | null;
    web?: boolean;
    onDelta?: (delta: string) => void;
  },
) => {
  if (!openai) {
    throw new Error("OPENAI_API_KEY must be set");
  }

  const requestedSongCount = toRequestedSongCount(message);
  const candidateSongCount = toCandidateSongCount(requestedSongCount);

  const stream = openai.responses.stream({
    model: "gpt-5.4-mini",
    store: true,
    instructions: buildSystemPrompt(requestedSongCount, candidateSongCount),
    input: message,
    tools: [
      ...(web ? [{ type: "web_search_preview" as const }] : []),
      {
        type: "function" as const,
        name: "recommend_songs",
        description:
          `Return up to ${candidateSongCount} recommended songs relevant to the conversation.`,
        strict: true,
        parameters: {
          type: "object",
          properties: {
            songs: {
              type: "array",
              maxItems: candidateSongCount,
              items: {
                type: "object",
                properties: {
                  song: { type: "string" },
                  artist: { type: "string" },
                  album: { type: "string" },
                },
                required: ["song", "artist", "album"],
                additionalProperties: false,
              },
            },
          },
          required: ["songs"],
          additionalProperties: false,
        },
      },
    ],
    parallel_tool_calls: false,
    tool_choice: {
      type: "function",
      name: "recommend_songs",
    },
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
    ...(conversationId ? { conversation: { id: conversationId } } : {}),
  });

  let assistantText = "";

  for await (const event of stream) {
    if (event.type !== "response.output_text.delta") {
      continue;
    }

    assistantText += event.delta;
    onDelta?.(event.delta);
  }

  const response = await stream.finalResponse();
  const initialText = assistantText || response.output_text || "";
  const toolRecommendations = extractRecommendations(
    response,
    candidateSongCount,
  );
  const fallbackRecommendations = toolRecommendations.length === 0
    ? extractRecommendationsFromText(initialText, candidateSongCount)
    : [];
  const recommendations = toolRecommendations.length
    ? toolRecommendations
    : fallbackRecommendations;
  const continuation = await ackRecommendationToolCalls(response);
  const continuationText = continuation.id !== response.id
    ? continuation.output_text || ""
    : "";
  const finalText = continuationText || initialText;

  return {
    assistantText: finalText,
    recommendations,
    requestedSongCount,
    responseId: continuation.id,
    conversationId: continuation.conversation?.id ??
      response.conversation?.id ?? conversationId ?? null,
  };
};
