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
    model: "gpt-4o",
    temperature: 1,
    messages: [{
      role: "system",
      content:
        "You are a helpful assistant named Luther that is a DJ and music expert.",
    }, {
      role: "user",
      content:
        `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
        Ensure the songs and album names are accurate and pulled from recognized discographies. 
        Format the response strictly as "Song Name -- Album Name -- Artist Name" 
        without any additional formatting or enumeration. 

        Prompt: ### 
        ${prompt}
        ###`,
    }],
  });

  const content = completion.choices[0].message.content;

  const songs = content?.split("\n")
    ?.map((data) => {
      const [song, album, artist] = data.split(" -- ").map((s) => s.trim());
      return { song, album, artist };
    });

  return songs;
};
