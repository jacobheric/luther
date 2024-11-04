import { HttpError, type PageProps } from "fresh";

export default function ErrorPage(props: PageProps) {
  const error = props.error;

  if (error instanceof HttpError) {
    const status = error.status;

    if (status === 404) {
      return (
        <div class="px-4 py-8 mx-auto my-10 text-2xl">
          nope
        </div>
      );
    }
  }

  console.error("fatal error", error);

  return <h1>uh oh...</h1>;
}
