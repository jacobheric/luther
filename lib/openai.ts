import "@std/dotenv/load";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "@/lib/config.ts";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    {
      role: "user",
      content: "Write a haiku about recursion in programming.",
    },
  ],
});

export const getSongs = async (prompt: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `List some songs that fit the following description, 
        don't provide any other information, 
        just a list of songs with no unnumeration in the 
        format of "Song Name -- Album Name -- Artist Name": ${prompt}`,
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
