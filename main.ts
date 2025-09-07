// main.ts
import { App, staticFiles, trailingSlashes } from "fresh";
import { State } from "./lib/state.ts";

export const app = new App<State>()
  .use(staticFiles())
  .use(trailingSlashes("never")).fsRoutes();
