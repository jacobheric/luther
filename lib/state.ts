import { createDefine } from "fresh";

export interface State {
  title?: string;
  description?: string;
  noIndex?: boolean;
}

export const define = createDefine<State>();
