import { Button } from "@/islands/button.tsx";
import { Devices } from "@/islands/devices.tsx";
import Tooltip from "@/islands/tooltip.tsx";
import { type Device, Image, type Track } from "@spotify/web-api-ts-sdk";
import { type FormEvent } from "preact/compat";
import { useState } from "preact/hooks";

export const Tracks = ({ tracks }: { tracks?: Track[] }) => {
  const [selected, setSelected] = useState<Track[]>(tracks || []);
  const [devices, setDevices] = useState<Device[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitType, setSubmitType] = useState<null | string>("play");

  const ready = () => devices.length && !submitting;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    setSubmitting(submitType);
    e.preventDefault();

    // Extract form data
    const form = e.currentTarget;

    const formData = new FormData(form);

    const response = submitType === "queue"
      ? await fetch("/api/spotify/queue", {
        method: "POST",
        body: formData,
      })
      : await fetch("/api/spotify/play", {
        method: "POST",
        body: formData,
      });

    if (!response.ok) {
      setError(submitType);
      throw new Error(`Error: ${response.statusText}`);
    }

    await response.text();
    setSubmitting(null);
    setSuccess(submitType);
  };

  return (
    <form onSubmit={submit}>
      <div className="mx-auto flex flex-col gap-2 w-full mt-2 mb-4">
        <div className="my-4 flex flex-row justify-between items-center w-full gap-2">
          <Devices
            tracks={selected.length > 0}
            devices={devices}
            setDevices={setDevices}
          />
          {selected.length > 0 && (
            <div className="flex flex-row justify-end items-center gap-2">
              {
                /* <Button
                onClick={(e) => {
                  e.preventDefault();
                  (document.getElementById(
                    "add-to-playlist",
                  ) as HTMLDialogElement)?.showModal();
                }}
                submitting={submitting === "playlist"}
                success={success === "playlist"}
                error={error === "playlist"}
              >
                + Playlist
              </Button>
              <Modal id="add-to-playlist" title="Add to Playlist">
                <PlaylistModal modalId="add-to-playlist" tracks={selected} />
              </Modal> */
              }

              <Tooltip
                className="top-14 right-2"
                tooltip={!ready() ? "No devices found" : undefined}
              >
                <Button
                  type="submit"
                  disabled={!ready()}
                  onClick={() => setSubmitType("queue")}
                  submitting={submitting === "queue"}
                  success={success === "queue"}
                  error={error === "queue"}
                >
                  + Queue
                </Button>
              </Tooltip>
              <Tooltip
                className="top-14 right-2"
                tooltip={!ready() ? "No devices found" : undefined}
              >
                <Button
                  type="submit"
                  disabled={!ready()}
                  onClick={() => setSubmitType("play")}
                  submitting={submitting === "play"}
                  success={success === "play"}
                  error={error === "play"}
                >
                  Play
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
        {selected?.map((song: Track, i: number) => (
          song && (
            <div
              className={`flex flex-row justify-start items-center gap-4 ${
                i !== selected.length - 1 && "border-b"
              } border-gray-200 w-full mb-2 pb-2`}
            >
              <button
                className="hover:border-red-500 hover:bg-red-100 hover:text-red-500 h-8 w-8 flex items-center justify-center"
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  setSelected(selected.filter((_, index) => i !== index));
                }}
              >
                X
              </button>
              <div>
                <div className="w-[65px] h-[65px] flex items-center justify-center">
                  <img
                    className="object-fill rounded"
                    src={song.album.images.find((i: Image) => i.height === 300)
                      ?.url}
                  />
                </div>
              </div>
              <div>
                <div>
                  <span className="text-gray-400">song:</span> {song.name}
                </div>
                <div>
                  <span className="text-gray-400">album:</span>{" "}
                  {song.album.name}
                </div>
                <div>
                  <span className="text-gray-400">artist:</span>{" "}
                  {song.artists[0].name}
                </div>
                <input type="hidden" name="trackURI" value={song.uri} />
              </div>
            </div>
          )
        ))}
      </div>
    </form>
  );
};
