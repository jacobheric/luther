import { SONGS } from "@/lib/signals/songs.ts";
import { useState } from "preact/hooks";
import { ERROR } from "@/lib/signals/songs.ts";
import { type FormEvent } from "preact/compat";

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
    </form>
  );
};
