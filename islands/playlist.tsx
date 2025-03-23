import { Button } from "@/islands/button.tsx";
import { type Playlist } from "@spotify/web-api-ts-sdk";
import { type FormEvent } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

export const PlaylistModal = (
  { modalId, add }: {
    modalId: string;
    add: (playlistId?: string, playlistName?: string) => void;
  },
) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlist, setPlaylist] = useState<string>("");

  const getPlaylists = async () => {
    const response = await fetch(`/api/spotify/playlists`);

    setPlaylists(JSON.parse(await response.text()));
  };

  useEffect(() => {
    getPlaylists();
  }, []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const playlistId = formData.get("playlistId")?.toString();
    const playlistName = formData.get("playlistName")?.toString();
    add(playlistId, playlistName);
    (document.getElementById(modalId) as HTMLDialogElement)?.close();
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col justify-start items-center w-full">
        <label className="w-full text-sm font-semibold">
          Existing or new?
        </label>
        <select
          name="playlistId"
          id="playlistId"
          className="w-full border"
          onChange={(e) => setPlaylist((e.target as HTMLSelectElement).value)}
          class="w-full"
        >
          <option className="p-3 m-3" value="" selected>New playlist</option>
          {playlists.map(({ id, name }: Playlist) => (
            <option className="p-3 m-3" value={id || ""}>{name}</option>
          ))}
        </select>

        {playlist === "" &&
          (
            <input
              type="text"
              name="playlistName"
              id="playlistName"
              className="w-full mt-4"
              placeholder="New playlist name"
              required
            />
          )}

        <div className="flex flex-row justify-end items-center gap-2 w-full mt-4">
          <Button
            type="submit"
            onClick={() =>
              (document.getElementById(modalId) as HTMLDialogElement)?.close()}
            className="text-gray-900 dark:text-white"
          >
            Cancel
          </Button>
          <Button type="submit" className="text-gray-900 dark:text-white">
            Add
          </Button>
        </div>
      </div>
    </form>
  );
};
