import "@std/dotenv/load";

import OpenAI from "openai";
import { GROK_API_KEY, OPENAI_API_KEY } from "@/lib/config.ts";

const openai = OPENAI_API_KEY && new OpenAI({ apiKey: OPENAI_API_KEY });
// const grok = GROK_API_KEY && new OpenAI({
//   apiKey: GROK_API_KEY,
//   baseURL: "https://api.x.ai/v1",
// });

const getInput = (prompt: string, mode: string) => ({
  model: mode === "smart"
    ? "chatgpt-4o-latest"
    : mode === "fast"
    ? "gpt-4o-mini"
    : "grok-beta",
  temperature: 1,
  messages: [{
    role: "system" as const,
    content: "You are a helpful assistant named Luther that is a music expert.",
  }, {
    role: "user" as const,
    content:
      `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
      Ensure the song and album names are accurate and likely to be found on Spotify. 

      Format the response strictly as "Song Name -- Album Name -- Artist Name" 
      without any additional information or enumeration. 

      Prompt: ### 
      ${prompt}
      ###`,
  }],
});

export const getSongs = async (prompt: string, mode: string = "smart") => {
  const input = getInput(prompt, mode);

  if (!openai) {
    throw Error("open ai sdk not instantiated");
  }

  const completion = await openai.chat.completions.create(input);
  //
  // coming soon
  // ? await grok.chat.completions.create(input)

  const content = completion.choices[0].message.content;

  const songs = content?.split("\n")
    ?.map((data) => {
      const [song, album, artist] = data.split(" -- ").map((s) => s.trim());
      return { song, album, artist };
    });

  return songs?.filter((song) => song.song && song.album && song.artist);
};
