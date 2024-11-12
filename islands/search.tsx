import { IS_BROWSER } from "fresh/runtime";
import { useEffect, useState } from "preact/hooks";

const getStoredPrompt = () =>
  IS_BROWSER ? globalThis.localStorage.getItem("storedPrompt") ?? "" : "";

const storePrompt = (prompt: string) => {
  if (IS_BROWSER) {
    globalThis.localStorage.setItem("storedPrompt", prompt);
  }
};

export const Search = ({ prompt }: { prompt?: string }) => {
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
    <div className="mx-auto mt-12 flex flex-row justify-center items-center gap-2">
      <input
        id="prompt"
        type="text"
        name="prompt"
        placeholder="what do you want to listen to?"
        required
        defaultValue={prompt || getStoredPrompt()}
      />
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
