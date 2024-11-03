import "@std/dotenv/load";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "@/lib/config.ts";

const openai = OPENAI_API_KEY && new OpenAI({ apiKey: OPENAI_API_KEY });

export const getSongs = async (prompt: string) => {
  if (!openai) {
    throw new Error(
      "OpenAI not initialized, did you provide the OPEN_API_KEY?",
    );
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `List songs that fit the following prompt. Try to provide
        least 10 songs, unless the prompst is asking for a specific result. 
        Don't provide any other information, 
        just a list of songs with no unnumeration in the 
        format of "Song Name -- Album Name -- Artist Name". 
        
        Prompt: ### 
        ${prompt}
        ###`,
    }],
  });

  const content = completion.choices[0].message.content;

  const songs = content?.split("\n").filter(
    (song: string) => song.trim(),
  );

  return songs?.map((data) => {
    const [song, album, artist] = data.split(" -- ");
    return { song, album, artist };
  });
};
