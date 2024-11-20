import "@std/dotenv/load";
import { completion as openAICompletion } from "@/lib/ai/openai.ts";
import { completion as grokCompletion } from "@/lib/ai/grok.ts";

const getInput = (prompt: string, mode: string) => ({
  model: mode === "smart"
    ? "chatgpt-4o-latest"
    : mode === "fast"
    ? "gpt-4o-mini"
    : "grok-beta",
  temperature: .8,
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

  const completion = mode === "recent"
    ? await grokCompletion(input)
    : await openAICompletion(input);

  const content = completion.choices[0].message.content;

  const songs = content?.split("\n")
    ?.map((data) => {
      const [song, album, artist] = data.split(" -- ").map((s) => s.trim());
      return { song, album, artist };
    });

  return songs?.filter((song) => song.song && song.album && song.artist);
};
