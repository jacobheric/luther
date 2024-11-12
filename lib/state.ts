import type { Session } from "@supabase/supabase-js";
import { createDefine } from "fresh";
import { SpotifyToken } from "./spotify/token.ts";

export interface State {
  title?: string;
  description?: string;
  noIndex?: boolean;
  script?: string;
  session?: Session;
  spotifyToken: SpotifyToken;
}

export const define = createDefine<State>();
