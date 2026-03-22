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
    <form onSubmit={submit} className="w-full flex flex-col gap-3">
      <label className="w-full text-sm font-semibold">
        Existing or new?
      </label>
      <select
        name="playlistId"
        id="playlistId"
        className="w-full"
        onChange={(e) => setPlaylist((e.target as HTMLSelectElement).value)}
      >
        <option value="" selected>New playlist</option>
        {playlists.map(({ id, name }: Playlist) => (
          <option value={id || ""}>{name}</option>
        ))}
      </select>

      {playlist === "" &&
        (
          <input
            type="text"
            name="playlistName"
            id="playlistName"
            className="w-full"
            placeholder="New playlist name"
            required
          />
        )}

      <div className="flex flex-row justify-end items-center gap-2 w-full">
        <button
          type="button"
          className="border rounded px-3 py-1 cursor-pointer"
          onClick={() =>
            (document.getElementById(modalId) as HTMLDialogElement)?.close()}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="border rounded px-3 py-1 cursor-pointer"
        >
          Add
        </button>
      </div>
    </form>
  );
};
