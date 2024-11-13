import "@std/dotenv/load";
import OpenAI from "openai";
import { GROK_API_KEY, OPENAI_API_KEY } from "@/lib/config.ts";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const grok = new OpenAI({
  apiKey: GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export const getSongs = async (prompt: string, mode: string = "smart") => {
  if (!openai) {
    throw new Error(
      "OpenAI not initialized, did you provide the OPEN_API_KEY?",
    );
  }

  const input = {
    model: mode === "smart"
      ? "chatgpt-4o-latest"
      : mode === "fast"
      ? "gpt-4o-mini"
      : "grok-beta",
    temperature: 1,
    messages: [{
      role: "system" as const,
      content:
        "You are a helpful assistant named Luther that is a music expert.",
    }, {
      role: "user" as const,
      content:
        `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
        Ensure the song and album names are accurate and likely to be found on Spotify. 

        Find the most recently released songs.

        Format the response strictly as "Song Name -- Album Name -- Artist Name" 
        without any additional information or enumeration. 

        Prompt: ### 
        ${prompt}
        ###`,
    }],
  };

  console.log("shit input", input);

  const completion = mode === "recent"
    ? await grok.chat.completions.create(input)
    : await openai.chat.completions.create(input);

  const content = completion.choices[0].message.content;

  const songs = content?.split("\n")
    ?.map((data) => {
      const [song, album, artist] = data.split(" -- ").map((s) => s.trim());
      return { song, album, artist };
    });

  return songs?.filter((song) => song.song && song.album && song.artist);
};
