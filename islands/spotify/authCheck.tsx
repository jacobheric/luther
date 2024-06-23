import { SpotifyApi } from "npm:@spotify/web-api-ts-sdk";

export const spotifyLogin = async () => {
  const authResponse = await SpotifyApi.performUserAuthorization(
    "91003acf10384519b1a792da5a7cf462",
    "http://localhost:8000",
    ["user-library-read"],
    "http://localhost:8000/api/spotify-token",
  );

  console.log("shit auth check response", authResponse);

  if (authResponse.authenticated) {
    window.location.replace("/tracks");
  }
};

export default function AuthCheck() {
  return (
    <div className="m-8">
      <button
        className="border border-gray-200 p-3 rounded-m"
        onClick={spotifyLogin}
      >
        Login To Spotify
      </button>
    </div>
  );
}
