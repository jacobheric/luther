import { GROK_API_KEY } from "@/lib/config.ts";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";
import OpenAI from "openai";

const grok = GROK_API_KEY &&
  new OpenAI({ apiKey: GROK_API_KEY, baseURL: "https://api.x.ai/v1" });

export const completion = async (
  input: ChatCompletionCreateParamsNonStreaming,
) => {
  if (!grok) {
    throw Error("open ai sdk not instantiated");
  }

  return await grok.chat.completions.create(input);
};
