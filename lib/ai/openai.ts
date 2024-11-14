import { OPENAI_API_KEY } from "@/lib/config.ts";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";
import OpenAI from "openai";

const openai = OPENAI_API_KEY && new OpenAI({ apiKey: OPENAI_API_KEY });

export const completion = async (
  input: ChatCompletionCreateParamsNonStreaming,
) => {
  if (!openai) {
    throw Error("open ai sdk not instantiated");
  }

  return await openai.chat.completions.create(input);
};
