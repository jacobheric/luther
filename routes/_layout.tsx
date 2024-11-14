import { type PageProps } from "fresh";
import { Partial } from "fresh/runtime";
import { Nav } from "@/islands/nav.tsx";
import { Logo } from "@/components/logo.tsx";

export default function Layout(ctx: PageProps) {
  const pathname = new URL(ctx.req.url).pathname;

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div className="flex flex-col justify-start">
        <div class="border-b p-4 flex flex-row justify-between ">
          <div>
            <h2 class="font-bold tracking-widest">
              <a
                class="no-underline flex flex-row justify-start items-center gap-1"
                href="/"
              >
                <div className="flex flex-row justify-start items-center">
                  <Logo className="w-4 fill-black dark:fill-white" />isten
                </div>
                <div>to</div>
                <div className="flex flex-row justify-start items-center">
                  <Logo className="w-4 fill-black dark:fill-white" /> uther
                </div>
              </a>
            </h2>
          </div>
          <Nav
            pathname={pathname}
          />
        </div>
        <div class="flex justify-center sm:w-[90%] px-4 md:max-w-6xl md:mx-auto">
          <Partial name="overlay-content">
            <ctx.Component />
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
