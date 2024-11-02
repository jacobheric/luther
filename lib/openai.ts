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

console.dir(completion, { depth: 20 });
