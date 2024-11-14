import { type Playlist, type Track } from "@spotify/web-api-ts-sdk";
import { useEffect, useState } from "preact/hooks";

export const PlaylistModal = (
  { tracks }: { tracks?: Track[] },
) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  if (!tracks) {
    return null;
  }

  const getPlaylists = async () => {
    const response = await fetch(`/api/spotify/playlists`);

    setPlaylists(JSON.parse(await response.text()));
  };

  useEffect(() => {
    getPlaylists();
  }, []);

  return (
    <div className="flex flex-row justify-start items-center gap-2 w-full">
      {playlists?.length > 0
        ? (
          <select
            name="playlist"
            id="playlist"
            className="p-0  w-full"
          >
            {playlists.map(({ id, name }: Playlist) => (
              <option className="px-2 mx-2 " value={id || ""}>{name}</option>
            ))}
          </select>
        )
        : <div>No Playlists Found</div>}
    </div>
  );
};
