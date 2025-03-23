import { streamResponse } from "@/lib/ai/openai.ts";

import { searchSong, TrackLite } from "@/lib/spotify/api.ts";
import { getAppToken } from "@/lib/spotify/token.ts";
import { extractSongs } from "@/lib/ai/songs.ts";

export type Mode = "smart" | "recent";
export const TEMP = 1;
export const MODE: Mode = "smart";

export const getInput = (
  prompt: string,
  mode: Mode = MODE,
  temperature: number = TEMP,
) => ({
  stream: true,
  model: "gpt-4o",
  ...(mode === "recent"
    ? {
      tools: [{
        "type": "web_search_preview",
      }],
      tool_choice: {
        "type": "web_search_preview",
      },
    }
    : {}),
  temperature,
  text: {
    "format": {
      "type": "json_schema",
      "name": "song_info",
      "schema": {
        "type": "object",
        "properties": {
          "songs": {
            "type": "array",
            "description": "A list of song entries.",
            "items": {
              "type": "object",
              "properties": {
                "artist": {
                  "type": "string",
                  "description": "The artist who performed the song.",
                },
                "album": {
                  "type": "string",
                  "description": "The album from which the song is taken.",
                },
                "song": {
                  "type": "string",
                  "description": "The title of the song.",
                },
              },
              "required": ["artist", "album", "song"],
              "additionalProperties": false,
            },
          },
        },
        "required": ["songs"],
        "additionalProperties": false,
      },
      "strict": true,
    },
  },
  input: [{
    role: "system" as const,
    content: "You are a helpful assistant named Luther that is a music expert.",
  }, {
    role: "user" as const,
    content: `Return at least 20 songs based on the following prompt, 
       unless the prompt is explicitly asking for a specific song. 
       Ensure the song and album names are accurate and likely to be found on Spotify. 
    

       Prompt: ### 
       ${prompt}
       ###`,
  }],
});

export const streamSongs = async ({
  prompt,
  mode = MODE,
  temp = TEMP,
  controller,
}: {
  prompt: string;
  mode?: Mode;
  temp?: number;
  controller: ReadableStreamDefaultController<Uint8Array>;
}) => {
  const appToken = await getAppToken();
  const input = getInput(prompt, mode, temp);

  const stream = await streamResponse(input);

  for await (
    const song of extractSongs(stream)
  ) {
    const spotifySong = await searchSong(appToken, song);
    enqueue(controller, spotifySong);
  }
  close(controller);
};

const enqueue = (
  controller: ReadableStreamDefaultController<Uint8Array>,
  song: TrackLite | null,
) => {
  try {
    song && controller?.enqueue(
      new TextEncoder().encode(JSON.stringify(song)),
    );
  } catch (e) {
    console.error("error enqueuing song", e);
  }
};

export const close = (
  controller: ReadableStreamDefaultController<Uint8Array>,
) => {
  try {
    controller?.close();
  } catch (e) {
    console.error("error closing controller", e);
  }
};
