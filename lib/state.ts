import { createDefine } from "fresh";
import { TokenData } from "@/lib/token.ts";

export interface State {
  spotifyToken: TokenData;
  title?: string;
  description?: string;
  noIndex?: boolean;
  script?: string;
}

export const define = createDefine<State>();
