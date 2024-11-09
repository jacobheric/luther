import { SpotifyKey } from "@/routes/spotify/login.tsx";
import { type AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { IS_BROWSER } from "fresh/runtime";
import { useEffect, useState } from "preact/hooks";

//
// We want to be good citizens and let the user know
// before sending them to spotify the first time.
const detectStorage = () =>
  IS_BROWSER &&
  !globalThis.localStorage.getItem(
    "spotify-sdk:AuthorizationCodeWithPKCEStrategy:token",
  ) && !globalThis.localStorage.getItem("spotify-sdk:verifier");

export default function SpotifyLogin(
  { spotifyClientId, origin }: SpotifyKey,
) {
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(detectStorage());

  useEffect(() => {
    !prompt && auth();
    //
    // if things go haywire, we'll prompt them again
    setTimeout(() => setPrompt(detectStorage()), 2000);
  }, []);

  const handleError = (error: unknown) => {
    console.error("Error authenticating with Spotify", error);
    setError("Failed to authenticate with Spotify, please try again later.");
  };

  const auth = async () => {
    try {
      await SpotifyApi.performUserAuthorization(
        spotifyClientId,
        `${origin}/spotify/login`,
        [
          "user-library-read",
          "user-read-playback-state",
          "user-modify-playback-state",
        ],
        async (accessToken: AccessToken) => {
          const response = await fetch("/api/spotify/access-token", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(accessToken),
          });

          if (!response.ok) {
            handleError(await response.text());
            return;
          }

          globalThis.location.href = "/";
        },
      );
    } catch (e: unknown) {
      handleError(e);
    }
  };

  return (
    <div className="m-8">
      {error && <p class="text-red-500">{error}</p>}

      {prompt && (
        <div class="flex flex-col justify-center items-center gap-8 mx-auto">
          <div class="prose dark:prose-invert">
            <span class="font-bold">Listen to Luther</span>{" "}
            needs access to queue and play tracks to your <span>Spotify</span>!
          </div>
          <input type="hidden" name="response_type" value="code" />
          <input type="hidden" name="client_id" value={spotifyClientId} />
          <input
            type="hidden"
            name="scope"
            value="user-library-read,user-read-playback-state,user-modify-playback-state"
          />
          <input
            type="hidden"
            name="redirect_uri"
            value={`${origin}/api/spotify/access-token`}
          />

          <button
            className="border border-gray-200 p-3 rounded"
            type="submit"
            onClick={auth}
          >
            Authorize Luther on Spotify
          </button>
        </div>
      )}
    </div>
  );
}
