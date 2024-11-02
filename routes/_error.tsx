import { HttpError, type PageProps } from "fresh";

export default function ErrorPage(props: PageProps) {
  const error = props.error; // Contains the thrown Error or HTTPError
  if (error instanceof HttpError) {
    const status = error.status; // HTTP status code

    // Render a 404 not found page
    if (status === 404) {
      return (
        <div class="px-4 py-8 mx-auto my-10 text-2xl">
          nope
        </div>
      );
    }
  }

  return <h1>uh oh...</h1>;
}
