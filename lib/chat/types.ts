import type { TrackLite } from "@/lib/spotify/api.ts";

export type ChatRole = "user" | "assistant";

export type ChatThread = {
  id: number;
  title: string;
  openai_conversation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  thread_id: number;
  role: ChatRole;
  content: string;
  song_cards: TrackLite[] | null;
  openai_response_id: string | null;
  created_at: string;
};

export type SongRecommendation = {
  song: string;
  artist: string;
  album?: string;
};

export type ChatStreamEvent =
  | {
    type: "thread_created";
    thread: ChatThread;
  }
  | {
    type: "assistant_delta";
    delta: string;
  }
  | {
    type: "assistant_done";
    message: ChatMessage;
  }
  | {
    type: "song_block";
    messageId: number;
    songs: TrackLite[];
  }
  | {
    type: "error";
    message: string;
  }
  | {
    type: "done";
  };
