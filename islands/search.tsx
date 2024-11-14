import { IS_BROWSER } from "fresh/runtime";
import { useEffect, useState } from "preact/hooks";

const getStoredPrompt = () =>
  IS_BROWSER ? globalThis.localStorage.getItem("storedPrompt") ?? "" : "";

const storePrompt = (prompt: string) => {
  if (IS_BROWSER) {
    globalThis.localStorage.setItem("storedPrompt", prompt);
  }
};

export const Search = (
  { prompt }: { prompt?: string; mode?: string },
) => {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSubmitting(false);
    document.getElementById("promptForm")?.addEventListener(
      "submit",
      () => {
        storePrompt(
          (document.getElementById("prompt") as HTMLInputElement)?.value || "",
        );
        setSubmitting(true);
      },
    );
  }, []);

  useEffect(() => {
    if (prompt) {
      globalThis.localStorage.removeItem("storedPrompt");
    }
  }, [prompt]);

  return (
    <div className="mx-auto mt-12 flex flex-row justify-center items-start gap-2">
      <div class="fled flex-col w-full">
        <input
          id="prompt"
          type="text"
          name="prompt"
          placeholder="what do you want to listen to?"
          required
          defaultValue={prompt || getStoredPrompt()}
          className="rounded-b-none"
        />
        {
          /* <div className="flex flex-row justify-start items-center gap-1 border border-gray-200 dark:bg-gray-900 rounded px-3 border-t-0 p-2 rounded-t-none">
          <div className="w-16">I prefer:</div>
          <select
            name="mode"
            id="mode"
            className="w-[65px] p-0 text-right"
          >
            <option selected={mode === "smart"} className="" value="smart">
              smart
            </option>
            <option selected={mode === "fast"} className="" value="fast">
              fast
            </option>
            <option selected={mode === "recent"} className="" value="recent">
              recent
            </option>
          </select>
        </div> */
        }
      </div>
      <button
        disabled={submitting}
        type="submit"
      >
        <div
          className={submitting ? "animate-spin" : ""}
        >
          Go
        </div>
      </button>
    </div>
  );
};
