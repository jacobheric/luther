import { streamCompletion } from "@/lib/ai/openai.ts";
import { streamCompletion as grokStreamCompletion } from "@/lib/ai/grok.ts";
import type { Stream } from "openai/streaming";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";

import { getAppToken } from "@/lib/spotify/token.ts";
import { searchSong, TrackLite } from "@/lib/spotify/api.ts";

export type Mode = "smart" | "fast" | "recent";
export const TEMP = 1;
export const MODE: Mode = "smart";

export const models = {
  smart: "chatgpt-4o-latest",
  fast: "gpt-4o-mini",
  recent: "grok-beta",
};

//
// Using unstructured output to save a few milliseconds.
// TODO: consider switching to structured json output
export const getInput = (
  prompt: string,
  mode: Mode = MODE,
  temperature: number = TEMP,
  stream: boolean = true,
) => ({
  model: models[mode],
  stream,
  temperature,
  messages: [{
    role: "system" as const,
    content: "You are a helpful assistant named Luther that is a music expert.",
  }, {
    role: "user" as const,
    content:
      `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
    Ensure the song and album names are accurate and likely to be found on Spotify. 

    Format the response strictly as "Song Name -- Album Name -- Artist Name" 
    without any additional informationm, enumeration or quotes. 

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

  const stream = mode === "recent"
    ? await grokStreamCompletion(input)
    : await streamCompletion(input);

  let buffer = "";

  for await (const chunk of stream as Stream<ChatCompletionChunk>) {
    const content = chunk.choices[0]?.delta?.content || "";

    if (content) {
      buffer += content;
      let newlineIndex;

      //
      // reconstitute songs from stream chunks
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line) {
          const [song, album, artist] = line.split(" -- ").map((s) => s.trim());
          const spotifySong = await searchSong(appToken, {
            song,
            album,
            artist,
          });

          //
          // send found songs to the client via SSE
          enqueue(controller, spotifySong);
        }
      }
    }
  }

  if (buffer.trim()) {
    const [song, album, artist] = buffer.split(" -- ").map((s) => s.trim());

    if (song && album && artist) {
      const aiSong = await searchSong(appToken, { song, album, artist });
      enqueue(controller, aiSong);
    }
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
