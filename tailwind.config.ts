import { type Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  plugins: [typography],
  darkMode: "media",
} satisfies Config;
