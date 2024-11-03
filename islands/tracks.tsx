import { useEffect, useState } from "preact/hooks";

export const Tracks = ({ tracks }: { tracks?: any[] }) => {
  const [selected, setSelected] = useState<any[]>(tracks || []);
  const [devices, setDevices] = useState<any[]>([]);

  const getDevices = async () => {
    const response = await fetch(`http://localhost:8000/api/spotify/devices`);
    setDevices(JSON.parse(await response.text()));
  };

  useEffect(() => {
    getDevices();
  }, []);

  const submit = async (e: any) => {
    e.preventDefault();

    // Extract form data
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const response = await fetch("http://localhost:8000/api/spotify/play", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    await response.text();
  };

  return (
    <form onSubmit={submit}>
      <div className="mx-auto flex flex-col gap-2 w-full mt-2 mb-4">
        {
          <div className="my-4 flex flex-row justify-between items-center">
            {devices?.length > 0
              ? (
                <div>
                  Devices:
                  <select
                    name="device"
                    id="device"
                    className="p-3 border-gray-200 rounded-m mx-3"
                  >
                    {devices.map(({ id, name }: any) => (
                      <option className="px-2 mx-2" value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              )
              : (
                <div>
                  No devices found. You must have spotify open to play. Open
                  spotify and{" "}
                  <a
                    className="cursor-pointer underline"
                    onClick={() => getDevices()}
                  >
                    refresh device list
                  </a>.
                </div>
              )}

            {devices?.length > 0 && selected.length > 0 && (
              <button
                className="border border-gray-200 bg-gray-100 p-3 rounded-m"
                type="submit"
              >
                Play
              </button>
            )}
          </div>
        }
        {selected?.map((song, i) => (
          song && (
            <div className="flex flex-row justify-start items-center gap-4 border-b border-gray-200 w-full mb-2 pb-2">
              <button
                className="border hover:border-red-500 hover:bg-red-100 hover:text-red-500 p-3"
                onClick={(e: any) => {
                  e.preventDefault();
                  setSelected(selected.filter((_, index) => i !== index));
                }}
              >
                X
              </button>
              <div className="mr-2">
                <img
                  src={song.album.images.find((i: any) => i.height === 64)?.url}
                />
              </div>
              <div>
                <div>
                  <span className="text-gray-400">song:</span> {song.name}
                </div>
                <div>
                  <span className="text-gray-400">album:</span>
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
