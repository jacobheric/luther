import { ResponseTextDeltaEvent } from "openai/resources/responses";

export type Song = {
  artist: string;
  album: string;
  song: string;
};

const START_TOKEN = '{"songs":[';

export const extractSongs = async function* (
  stream: AsyncIterable<ResponseTextDeltaEvent>,
): AsyncGenerator<Song> {
  let buffer = "";
  let started = false;

  for await (const { delta } of stream) {
    buffer += delta ?? "";

    if (!started) {
      const startIdx = buffer.indexOf(START_TOKEN);
      if (startIdx === -1) {
        continue;
      }
      buffer = buffer.slice(startIdx + START_TOKEN.length);
      started = true;
    }

    let endIdx: number;
    while ((endIdx = buffer.indexOf("}")) !== -1) {
      const firstBrace = buffer.indexOf("{");
      if (firstBrace === -1) {
        break;
      }

      const candidate = buffer.slice(firstBrace, endIdx + 1).trim();
      if (!candidate) {
        buffer = buffer.slice(endIdx + 1);
        continue;
      }

      try {
        const song = JSON.parse(candidate);
        yield song;
        buffer = buffer.slice(endIdx + 1).replace(/^,/, "").trim();
      } catch (error) {
        console.debug("song parse error", error);
        break;
      }
    }
  }

  //
  // check the remainder
  const final = buffer.trim();
  if (final) {
    try {
      yield JSON.parse(final);
    } catch (error) {
      //
      // invalid end bits are normal, consider it debug
      console.debug("final song parse error", error);
    }
  }
};
