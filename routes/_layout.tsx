import { type PageProps } from "fresh";
import { Partial } from "fresh/runtime";
import { Nav } from "@/islands/nav.tsx";
import { NowPlaying } from "@/islands/now_playing.tsx";
import { Logo } from "@/components/logo.tsx";

export default function Layout(ctx: PageProps) {
  const pathname = new URL(ctx.req.url).pathname;

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <div className="flex flex-col justify-start flex-1">
        <div class="border-b p-4 flex flex-row justify-between h-14">
          <div class="flex items-center">
            <a
              class="no-underline flex items-center"
              href="/"
              aria-label="Luther Home"
            >
              <Logo className="w-4 h-4 fill-black dark:fill-white" />
            </a>
          </div>
          <div className="flex-1 min-w-0 px-2 flex items-center justify-center">
            <NowPlaying pathname={pathname} />
          </div>

          <Nav
            pathname={pathname}
          />
        </div>
        <div class="w-full flex justify-center px-2 sm:px-4 sm:w-[90%] md:max-w-6xl md:mx-auto overflow-x-hidden">
          <Partial name="overlay-content">
            <ctx.Component />
          </Partial>
        </div>
      </div>
    </div>
  );
}
