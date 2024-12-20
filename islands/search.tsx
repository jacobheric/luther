import { Logo } from "@/components/logo.tsx";
import { ERROR, SONGS } from "@/lib/signals/songs.ts";
import { type Track } from "@spotify/web-api-ts-sdk";
import { IS_BROWSER } from "fresh/runtime";
import { type FormEvent } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

import X from "tabler-icons/tsx/x.tsx";
import Q from "tabler-icons/tsx/question-mark.tsx";
import Tooltip from "@/islands/tooltip.tsx";

const NOT_FOUND = "No songs found, try adjusting your prompt.";

const getStoredPrompt = () =>
  IS_BROWSER ? globalThis.localStorage.getItem("storedPrompt") ?? "" : "";

const storePrompt = (prompt: string) => {
  if (IS_BROWSER) {
    globalThis.localStorage.setItem("storedPrompt", prompt);
  }
};

const getStoredSongs = (): Track[] => {
  if (!IS_BROWSER) {
    return [];
  }
  const tracks = globalThis.localStorage.getItem("storedTracks");
  if (tracks) {
    return JSON.parse(tracks);
  }
  return [];
};

const setStoredSongs = (songs: Track[]) => {
  if (!IS_BROWSER) {
    return [];
  }

  globalThis.localStorage.setItem("storedTracks", JSON.stringify(songs));
};

const parseSong = (song: string) => {
  try {
    return JSON.parse(song);
  } catch (e) {
    console.error("error parsing song", song, e);
    return null;
  }
};

export const Search = ({ test }: { test?: boolean }) => {
  const [submitting, setSubmitting] = useState(false);
  const [prompt, setPrompt] = useState(getStoredPrompt());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (SONGS.value.length) {
      return;
    }

    const storedTracks = getStoredSongs();
    if (storedTracks.length) {
      SONGS.value = storedTracks;
    }
    setLoading(false);
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    SONGS.value = [];
    ERROR.value = null;
    setSubmitting(true);

    if (test) {
      setTimeout(() => {
        setSubmitting(false);
      }, 3000);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const prompt = formData.get("prompt")?.toString();
    prompt && storePrompt(prompt);

    const response = await fetch("/api/songs", {
      method: "POST",
      body: formData,
    });

    if (!response.ok || !response.body) {
      console.error("error searching songs", await response.text());
      ERROR.value = "There was an error searching songs. Please try again.";
      setSubmitting(false);
      return;
    }

    try {
      const reader = response.body.pipeThrough(new TextDecoderStream())
        .getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const parsed = parseSong(value);
        if (parsed) {
          SONGS.value = [...SONGS.value, ...[parsed]];
          setStoredSongs(SONGS.value);
        }
      }
    } catch (e) {
      console.error("error reading songs", e);
      ERROR.value = "There was an error searching songs. Please try again.";
    }

    setSubmitting(false);

    if (SONGS.value.length === 0) {
      ERROR.value = NOT_FOUND;
    }
  };

  return (
    <form method="post" id="promptForm" onSubmit={submit}>
      <div
        className={`mx-auto flex flex-row justify-center items-start gap-2 flex-wrap sm:flex-nowrap mt-6 sm:mt-12`}
      >
        <div class="flex flex-col w-full">
          <div className="flex flex-row justify-start relative w-full">
            <input
              id="prompt"
              type="text"
              name="prompt"
              placeholder="what do you want to listen to?"
              required
              value={prompt}
              onInput={(e) => {
                setPrompt((e.target as HTMLInputElement).value);
              }}
              className="w-full border-r-0 rounded-r-none"
            />
            <div className="border border-gray-200 dark:bg-gray-900 py-3 px-2 rounded border-l-0 rounded-l-none text-gray-900 dark:text-white">
              {loading ? null : prompt
                ? (
                  <X
                    className="cursor-pointer w-5"
                    onClick={() => setPrompt("")}
                  />
                )
                : (
                  <Tooltip
                    tooltip={
                      <div>
                        things to try: <br />
                        "Tom Petty deep cuts" <br />
                        "sad songs by Lana Del Rey" <br />
                        "indie summer 2010"
                      </div>
                    }
                    className="top-6 right-2"
                    tooltipClassName="p-0 m-0 block"
                  >
                    <Q className="cursor-pointer w-5" />
                  </Tooltip>
                )}
            </div>
          </div>
          {
            /* <div className="flex flex-row justify-between items-center gap-1 border border-gray-200 dark:bg-gray-900 rounded px-3 border-t-0 p-2 rounded-t-none">
            <select
              name="mode"
              id="mode"
              className="h-6 w-auto min-w-fit pr-6 py-0 px-2 text-xs"
            >
              <option value="smart">
                prefer smart
              </option>
              <option value="recent">
                prefer recent
              </option>
            </select>
          </div> */
          }
        </div>
        <button
          disabled={submitting}
          type="submit"
          className="w-full sm:w-auto flex flex-row justify-center items-center"
        >
          <div className="flex flex-row justify-center items-center w-[90px]">
            <Logo
              className={`w-4 fill-gray-900 dark:fill-white mr-[1px] ${
                submitting && "animate-spin mr-0.5"
              }`}
            />
            utheriz{submitting ? "ing" : "e"}
          </div>
        </button>
      </div>
    </form>
  );
};
