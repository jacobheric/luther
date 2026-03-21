import { createDefine } from "fresh";
import type { AppSession } from "./auth.ts";
import { SpotifyToken } from "./spotify/token.ts";

export interface State {
  title?: string;
  description?: string;
  noIndex?: boolean;
  script?: string;
  session?: AppSession;
  spotifyToken: SpotifyToken;
}

export const define = createDefine<State>();
