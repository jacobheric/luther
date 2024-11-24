import { Button } from "@/islands/button.tsx";
import { Controls } from "@/islands/controls.tsx";
import { Cover } from "@/islands/cover.tsx";
import { Devices } from "@/islands/devices.tsx";
import { Modal } from "@/islands/modal.tsx";
import { PlaylistModal } from "@/islands/playlist.tsx";
import Tooltip from "@/islands/tooltip.tsx";
import { ERROR, SONGS } from "@/lib/signals/songs.ts";
import { testSongs } from "@/lib/test/data.ts";
import { type Device, type Track } from "@spotify/web-api-ts-sdk";
import { type FormEvent } from "preact/compat";
import { useRef, useState } from "preact/hooks";

export const Tracks = ({ test }: { test?: boolean }) => {
  const playListNameRef = useRef<HTMLInputElement>(null);
  const playListIdRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitTypeRef = useRef<HTMLInputElement>(null);
  const singleTrackRef = useRef<HTMLInputElement>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready = () => devices.length && !submitting;

  if (test) {
    SONGS.value = testSongs as Track[];
  }

  const api = async (formData: FormData) => {
    const submitType = submitTypeRef.current!.value;
    setSubmitting(submitType);
    const response = submitType === "queue"
      ? await fetch("/api/spotify/queue", {
        method: "POST",
        body: formData,
      })
      : submitType === "play"
      ? await fetch("/api/spotify/play", {
        method: "POST",
        body: formData,
      })
      : await fetch("/api/spotify/playlist", {
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
    setTimeout(() => setSuccess(null), 3000);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const single = formData.get("singleTrackURI");

    if (single) {
      formData.delete("trackURI");
      formData.set("trackURI", single);
    }
    await api(formData);
  };

  return (
    <form ref={formRef} onSubmit={submit}>
      <input
        ref={submitTypeRef}
        type="hidden"
        name="submitType"
        id="submitType"
        value="play"
      />
      <input ref={singleTrackRef} type="hidden" name="singleTrackURI" />
      <div className="mx-auto flex flex-col gap-2 w-full mt-2 mb-4">
        <div className="my-4 flex flex-row justify-between md:justify-end items-center w-full gap-2 flex-wrap md:flex-nowrap">
          <Devices
            tracks={SONGS.value.length > 0}
            devices={devices}
            setDevices={setDevices}
          />
          {SONGS.value.length > 0 && (
            <div className="flex flex-row justify-items-stretch md:justify-end items-center gap-2 w-full">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  submitTypeRef.current!.value = "playlist";
                  (document.getElementById(
                    "add-to-playlist",
                  ) as HTMLDialogElement)?.showModal();
                }}
                submitting={submitting === "playlist"}
                success={success === "playlist"}
                error={error === "playlist"}
                className="whitespace-nowrap w-1/3 md:w-fit"
              >
                + Playlist
              </Button>

              <input ref={playListIdRef} type="hidden" name="playlistId" />
              <input
                ref={playListNameRef}
                type="hidden"
                name="playlistName"
              />
              <Modal id="add-to-playlist" title="Add to Playlist">
                <PlaylistModal
                  modalId="add-to-playlist"
                  add={(playlistId, playlistName) => {
                    playListIdRef.current!.value = playlistId || "";
                    playListNameRef.current!.value = playlistName || "";

                    const submitEvent = new Event("submit", {
                      cancelable: true,
                      bubbles: true,
                    });
                    formRef.current!.dispatchEvent(submitEvent);
                  }}
                />
              </Modal>

              <Tooltip
                className="top-14 right-2"
                tooltipClassName="w-1/3 md:w-fit"
                tooltip={!ready() ? "No devices found" : undefined}
              >
                <Button
                  type="submit"
                  disabled={!ready()}
                  onClick={() => submitTypeRef.current!.value = "queue"}
                  submitting={submitting === "queue"}
                  success={success === "queue"}
                  error={error === "queue"}
                  className="whitespace-nowrap w-full md:w-fit"
                >
                  + Queue
                </Button>
              </Tooltip>

              <Tooltip
                className="top-14 right-2"
                tooltipClassName="w-1/3 md:w-fit"
                tooltip={!ready() ? "No devices found" : undefined}
              >
                <Button
                  type="submit"
                  disabled={!ready()}
                  onClick={() => submitTypeRef.current!.value = "play"}
                  submitting={submitting === "play"}
                  success={success === "play"}
                  error={error === "play"}
                  className="whitespace-nowrap w-full md:w-fit"
                >
                  Play
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
        {ERROR.value && (
          <div class="prose dark:prose-invert">
            {ERROR.value}
          </div>
        )}
        {SONGS.value.map((song: Track, i: number) => (
          song && (
            <div
              className={`flex flex-row justify-start items-center gap-4 ${
                i !== SONGS.value.length - 1 && "border-b"
              } border-gray-200 w-full mb-2 pb-2`}
            >
              <div class="flex flex-col gap-1">
                <Controls
                  remove={() =>
                    SONGS.value = SONGS.value.filter((_, index) => i !== index)}
                  form={formRef.current!}
                  submitType={submitTypeRef.current!}
                  singleTrack={singleTrackRef.current!}
                  trackURI={song.uri}
                />
              </div>
              <div>
                <div className="w-[65px] h-[65px] flex items-center justify-center">
                  <Cover images={song.album.images} />
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
