import { OPENAI_API_KEY } from "@/lib/config.ts";
import type {
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import OpenAI from "openai";

const openai = OPENAI_API_KEY && new OpenAI({ apiKey: OPENAI_API_KEY });

export const completion = async (
  input: ChatCompletionCreateParamsNonStreaming,
) => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }

  return await openai.chat.completions.create(input);
};

export const streamCompletion = async (
  input: ChatCompletionCreateParams,
) => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }

  return await openai.chat.completions.create(input);
};
