import { type PageProps } from "fresh";
import { Partial } from "fresh/runtime";
import { Nav } from "@/islands/nav.tsx";

export default function Layout({ Component }: PageProps) {
  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div className="flex flex-col justify-start">
        <div class="border-b p-4 flex flex-row justify-between ">
          <div>
            <h2 class="font-bold tracking-widest">
              <a
                class="no-underline"
                href="/"
              >
                Listen to Luther
              </a>
            </h2>
          </div>
          <Nav />
        </div>
        <div class="flex justify-center sm:w-[90%] px-4 md:max-w-6xl md:mx-auto">
          <Partial name="overlay-content">
            <Component />
          </Partial>
        </div>
      </div>
      <footer class="border-t flex flex-row items-center tracking-wide justify-center p-3 gap-1">
        <div className="w-full inline text-right">
          <a
            href="https://github.com/jacobheric/luther"
            class="inline"
          >
            Made
          </a>{" "}
          with
        </div>

        <div className="text-xl">
          &#9829;
        </div>

        <div className="flex flex-row justify-start w-full">
          in Maine
        </div>
      </footer>
    </div>
  );
}
