import { ERROR, SONGS } from "@/lib/signals/songs.ts";
import { type FormEvent } from "preact/compat";
import { useState } from "preact/hooks";

const NOT_FOUND = "No songs found, try adjusting your prompt.";

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

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    SONGS.value = [];
    ERROR.value = null;
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

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
      <div className="mx-auto mt-12 flex flex-row justify-center items-start gap-2">
        <div class="fled flex-col w-full">
          <input
            id="prompt"
            type="text"
            name="prompt"
            placeholder="what do you want to listen to?"
            required
            defaultValue={test ? "tom petty deep cuts" : ""}
            className="rounded-b-none"
          />
          {
            /* <div className="flex flex-row justify-between items-center gap-1 border border-gray-200 dark:bg-gray-900 rounded px-3 border-t-0 p-2 rounded-t-none">
            <select
              name="mode"
              id="mode"
              className="h-6 w-auto min-w-fit pr-6 py-0 px-2 text-xs text-gray-700"
            >
              <option value="smart">
                prefer smart
              </option>
              <option value="recent">
                prefer recent
              </option>
            </select>
            {submitting && (
              <div className="flex flex-row justify-start items-center animate-pulse">
                <Logo className="w-4 fill-gray-900 dark:fill-white animate-spin" />
                {" "}
                utherizing...
              </div>
            )}
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
    </form>
  );
};
