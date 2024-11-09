import { Devices } from "@/islands/devices.tsx";
import { useState } from "preact/hooks";
import Loader2 from "tabler-icons/tsx/loader-2.tsx";

export const Tracks = ({ tracks }: { tracks?: any[] }) => {
  const [selected, setSelected] = useState<any[]>(tracks || []);
  const [devices, setDevices] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitType, setSubmitType] = useState("play");

  const submit = async (e: any) => {
    setSubmitting(true);
    e.preventDefault();

    // Extract form data
    const form = e.target as HTMLFormElement;
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
      throw new Error(`Error: ${response.statusText}`);
    }

    await response.text();
    setSubmitting(false);
    setMessage("Done!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <form onSubmit={submit}>
      <div className="mx-auto flex flex-col gap-2 w-full mt-2 mb-4">
        {
          <div className="my-4 flex flex-row justify-between items-center w-full">
            <Devices
              tracks={selected.length > 0}
              devices={devices}
              setDevices={setDevices}
            />
            {devices?.length > 0 && selected.length > 0 && (
              <div className="flex flex-row justify-end items-center gap-2">
                {submitting && <Loader2 className="animate-spin" />}
                {message ? message : null}
                <button
                  className={`${submitting ? "cursor-not-allowed" : ""}`}
                  type="submit"
                  disabled={submitting}
                  onClick={() => setSubmitType("queue")}
                >
                  Queue
                </button>
                <button
                  className={`${submitting ? "cursor-not-allowed" : ""}`}
                  type="submit"
                  disabled={submitting}
                  onClick={() => setSubmitType("play")}
                >
                  Play
                </button>
              </div>
            )}
          </div>
        }
        {selected?.map((song, i) => (
          song && (
            <div
              className={`flex flex-row justify-start items-center gap-4 ${
                i !== selected.length - 1 && "border-b"
              } border-gray-200 w-full mb-2 pb-2`}
            >
              <button
                className="hover:border-red-500 hover:bg-red-100 hover:text-red-500 p-3 "
                onClick={(e: any) => {
                  e.preventDefault();
                  setSelected(selected.filter((_, index) => i !== index));
                }}
              >
                X
              </button>
              <div>
                <img
                  className="w-[65px] h-[65px] object-fill"
                  src={song.album.images.find((i: any) => i.height === 300)
                    ?.url}
                />
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
