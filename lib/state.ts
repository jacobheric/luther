import type { Session } from "@supabase/supabase-js";
import { createDefine } from "fresh";

export interface State {
  title?: string;
  description?: string;
  noIndex?: boolean;
  script?: string;
  session?: Session;
}

export const define = createDefine<State>();
