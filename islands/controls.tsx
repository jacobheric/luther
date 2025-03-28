import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "@/islands/button.tsx";
import ControlIcon from "tabler-icons/tsx/adjustments-horizontal.tsx";

export type PlayerControls = {
  form: HTMLFormElement;
  singleTrack: HTMLInputElement;
  submitType: HTMLInputElement;
  trackURI: string;
  spotifyURI: string;
};

export const Controls = (
  { form, submitType, singleTrack, trackURI, spotifyURI }: PlayerControls,
) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const submitEvent = new Event("submit", {
    bubbles: true,
    cancelable: true,
  });

  useEffect(() => {
    const clickAway = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", clickAway);
    return () => {
      document.removeEventListener("mousedown", clickAway);
    };
  }, [dropdownRef]);

  return (
    <div
      ref={dropdownRef}
      class="relative flex flex-row items-center"
      onClick={() => setShowDropdown(!showDropdown)}
    >
      <Button
        type="button"
        className="h-7 w-7 flex items-center justify-center"
      >
        <ControlIcon className="w-5 h-5 opacity-60" />
      </Button>

      {showDropdown &&
        (
          <div class="absolute top-0 left-10 rounded w-32 border bg-white dark:bg-gray-900 z-10 shadow-md cursor-pointer">
            <div
              class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 no-underline"
              onClick={() => {
                submitType.value = "play";
                singleTrack.value = trackURI;
                form.dispatchEvent(submitEvent);
              }}
            >
              Play
            </div>

            <div
              class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 no-underline"
              onClick={() => {
                submitType.value = "queue";
                singleTrack.value = trackURI;
                form.dispatchEvent(submitEvent);
              }}
            >
              Queue
            </div>

            <div
              class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 no-underline"
              onClick={() => {
                submitType.value = "playlist";
                singleTrack.value = trackURI;
                (document.getElementById(
                  "add-to-playlist",
                ) as HTMLDialogElement)?.showModal();
              }}
            >
              Playlist
            </div>
            <a
              href={spotifyURI}
              target="_blank"
              class="cursor-pointer no-underline"
            >
              <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                Spotify
              </div>
            </a>
          </div>
        )}
    </div>
  );
};
