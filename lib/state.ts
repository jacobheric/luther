import { createDefine } from "fresh";
import type { Session } from "@supabase/supabase-js";
import { TokenData } from "@/lib/token.ts";

export interface State {
  spotifyToken: TokenData;
  title?: string;
  description?: string;
  noIndex?: boolean;
  script?: string;
  session?: Session;
}

export const define = createDefine<State>();
