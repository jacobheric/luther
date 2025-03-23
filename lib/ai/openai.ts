import { OPENAI_API_KEY } from "@/lib/config.ts";
import type {
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import OpenAI from "openai";
import {
  ResponseCreateParamsStreaming,
  ResponseTextDeltaEvent,
} from "openai/resources/responses";

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

export const streamResponse = async (
  input: ResponseCreateParamsStreaming,
): Promise<AsyncIterable<ResponseTextDeltaEvent>> => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }
  return (await openai.responses.create(input)) as unknown as AsyncIterable<
    ResponseTextDeltaEvent
  >;
};
