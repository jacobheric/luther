import { extractSongs } from "@/lib/ai/songs.ts";
import { OPENAI_API_KEY } from "@/lib/config.ts";
import OpenAI from "openai";

const openai = OPENAI_API_KEY && new OpenAI({ apiKey: OPENAI_API_KEY });

export const completionStream = async () => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }

  const stream = await openai.chat.completions.create({
    stream: true,
    model: "chatgpt-4o-latest",
    temperature: .8,
    messages: [{
      role: "system" as const,
      content:
        "You are a helpful assistant named Luther that is a music expert.",
    }, {
      role: "user" as const,
      content:
        `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
      Ensure the song and album names are accurate and likely to be found on Spotify. 

      Format the response strictly as "Song Name -- Album Name -- Artist Name" 
      without any additional information or enumeration. 

      Prompt: ### 
      bruce springsteen low fidelity
      ###`,
    }],
  });

  let buffer = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";

    if (content) {
      buffer += content; // Append new content to the buffer
      let newlineIndex;

      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line) {
          const [song, album, artist] = line.split(" -- ").map((s) => s.trim());
          console.log("complete song", { song, album, artist });
        }
      }
    }
  }

  if (buffer.trim()) {
    const [song, album, artist] = buffer.split(" -- ").map((s) => s.trim());
    if (song && album && artist) {
      console.log("complete song cleanup", { song, album, artist });
    }
  }
};

export const structuredCompletionStream = async () => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }

  const stream = await openai.beta.chat.completions.stream({
    model: "chatgpt-4o-latest",
    temperature: .8,
    messages: [{
      role: "system" as const,
      content:
        "You are a helpful assistant named Luther that is a music expert.",
    }, {
      role: "user" as const,
      content:
        `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
      Ensure the song and album names are accurate and likely to be found on Spotify. 

      Format the response strictly as json in the form of:
      { songs:[{"song": "song name", "album": "album name", "artist": "artist name"}] }
      without any additional information.

      Prompt: ### 
      tom petty deep cuts
      ###`,
    }],
    response_format: {
      type: "json_object",
    },
  });

  // stream.on("content", (delta, snapshot) => {
  //   console.log("structured stream delta", delta);
  //   console.log("structured stream snapshot", snapshot);
  // });

  for await (const chunk of stream) {
    console.log(
      "structured stream chunk",
      chunk.choices[0]?.delta?.content || "",
    );
  }
};

export const structuredCompletion = async () => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }

  const completion = await openai.chat.completions.create({
    model: "chatgpt-4o-latest",
    temperature: .8,
    messages: [{
      role: "system" as const,
      content:
        "You are a helpful assistant named Luther that is a music expert.",
    }, {
      role: "user" as const,
      content:
        `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
      Ensure the song and album names are accurate and likely to be found on Spotify. 

      Format the response strictly as json in the form of:
      { songs:[{"song": "song name", "album": "album name", "artist": "artist name"}] }
      without any additional information. 

      Prompt: ### 
      tom petty deep cuts
      ###`,
    }],
    response_format: {
      type: "json_object",
    },
  });

  console.log("completion", completion.choices[0]?.message.content);
};

export const unstructuredCompletion = async () => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }

  const completion = await openai.chat.completions.create({
    model: "chatgpt-4o-latest",
    temperature: .8,
    messages: [{
      role: "system" as const,
      content:
        "You are a helpful assistant named Luther that is a music expert.",
    }, {
      role: "user" as const,
      content:
        `List at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
      Ensure the song and album names are accurate and likely to be found on Spotify. 

      Format the response strictly as: 
      
      Song Name -- Album Name -- Artist Name
      
      without any additional information,enumeration or quotes. 

      Prompt: ### 
      tom petty deep cuts
      ###`,
    }],
  });

  const content = await completion.choices[0]?.message.content;

  console.log("completion", content);
};

export const responsesWebSearch = async () => {
  if (!openai) {
    console.error("open ai sdk not instantiated");
    throw Error("open ai sdk not instantiated");
  }

  const stream = await openai.responses.create({
    stream: true,
    model: "gpt-4o",
    tools: [
      {
        "type": "web_search_preview",
        "user_location": {
          "type": "approximate",
        },
        "search_context_size": "medium",
      },
    ],
    tool_choice: {
      "type": "web_search_preview",
    },
    temperature: 1,
    text: {
      "format": {
        "type": "json_schema",
        "name": "song_info",
        "schema": {
          "type": "object",
          "properties": {
            "songs": {
              "type": "array",
              "description": "A list of song entries.",
              "items": {
                "type": "object",
                "properties": {
                  "artist": {
                    "type": "string",
                    "description": "The artist who performed the song.",
                  },
                  "album": {
                    "type": "string",
                    "description": "The album from which the song is taken.",
                  },
                  "song": {
                    "type": "string",
                    "description": "The title of the song.",
                  },
                },
                "required": ["artist", "album", "song"],
                "additionalProperties": false,
              },
            },
          },
          "required": ["songs"],
          "additionalProperties": false,
        },
        "strict": true,
      },
    },
    input: [{
      role: "system" as const,
      content:
        "You are a helpful assistant named Luther that is a music expert.",
    }, {
      role: "user" as const,
      content:
        `Return at least 20 songs based on the following prompt, unless the prompt is for a specifc thing. 
      Ensure the song and album names are accurate and likely to be found on Spotify. 

      Prompt: ### 
      latest amyl and the sniffers
      ###`,
    }],
  });

  for await (const song of extractSongs(stream)) {
    console.log("spotify song", song);
  }
};

responsesWebSearch();

// completionStream();
