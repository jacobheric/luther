import { GROK_API_KEY } from "@/lib/config.ts";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import OpenAI from "openai";

const grok = GROK_API_KEY &&
  new OpenAI({ apiKey: GROK_API_KEY, baseURL: "https://api.x.ai/v1" });

export const completion = async (
  input: ChatCompletionCreateParams,
) => {
  if (!grok) {
    throw Error("grok sdk not instantiated");
  }

  return await grok.chat.completions.create(input);
};

export const streamCompletion = async (
  input: ChatCompletionCreateParams,
) => {
  if (!grok) {
    console.error("grok sdk not instantiated");
    throw Error("grok sdk not instantiated");
  }

  return await grok.chat.completions.create(input);
};
