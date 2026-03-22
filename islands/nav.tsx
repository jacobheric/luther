import { useEffect, useRef, useState } from "preact/hooks";
import Messages from "tabler-icons/tsx/messages.tsx";
import DeviceSpeaker from "tabler-icons/tsx/device-speaker.tsx";
import Home from "tabler-icons/tsx/home.tsx";
import Logout from "tabler-icons/tsx/logout.tsx";
import Login2 from "tabler-icons/tsx/login-2.tsx";
import Playlist from "tabler-icons/tsx/playlist.tsx";

type NavPanel = "threads" | "devices" | "playlists";

const menuItemClass =
  "cursor-pointer !border-0 !bg-transparent !rounded-none block w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 no-underline";
const menuItemContentClass = "inline-flex items-center gap-2";
const menuIconClass = "w-4 h-4 shrink-0";

export const Nav = (
  { pathname }: { pathname: string },
) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const openPanel = (panel: NavPanel) => {
    globalThis.dispatchEvent(
      new CustomEvent("luther:open-nav-panel", {
        detail: { panel },
      }),
    );
    setShowDropdown(false);
  };

  useEffect(() => {
    const clickAway = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", clickAway);
    return () => {
      document.removeEventListener("mousedown", clickAway);
    };
  }, [dropdownRef]);

  if (pathname === "/login" || pathname === "/logout") {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      class="relative z-[11000] flex flex-row items-center"
    >
      <button
        type="button"
        class="cursor-pointer !p-0 !border-0 !bg-transparent !rounded-none flex flex-col items-center justify-center w-10 h-4"
        onClick={() => setShowDropdown((current) => !current)}
      >
        <span class="block w-5 h-0.5 mb-1 dark:bg-white bg-gray-900"></span>
        <span class="block w-5 h-0.5 mb-1 dark:bg-white bg-gray-900"></span>
        <span class="block w-5 h-0.5 dark:bg-white bg-gray-900"></span>
      </button>

      {showDropdown &&
        (
          <div class="absolute top-8 right-2 rounded w-44 border bg-white dark:bg-gray-900 z-[11010] shadow-md">
            <a
              href="/"
              class={menuItemClass}
              onClick={() => setShowDropdown(false)}
            >
              <span class={menuItemContentClass}>
                <Home class={menuIconClass} />
                Home
              </span>
            </a>
            {pathname === "/" && (
              <>
                <button
                  type="button"
                  class={menuItemClass}
                  onClick={() => openPanel("threads")}
                >
                  <span class={menuItemContentClass}>
                    <Messages class={menuIconClass} />
                    Conversations
                  </span>
                </button>
                <button
                  type="button"
                  class={menuItemClass}
                  onClick={() => openPanel("devices")}
                >
                  <span class={menuItemContentClass}>
                    <DeviceSpeaker class={menuIconClass} />
                    Devices
                  </span>
                </button>
                <button
                  type="button"
                  class={menuItemClass}
                  onClick={() => openPanel("playlists")}
                >
                  <span class={menuItemContentClass}>
                    <Playlist class={menuIconClass} />
                    Playlists
                  </span>
                </button>
              </>
            )}
            {pathname !== "/login" && pathname !== "/" &&
              (
                <a
                  href="/login"
                  class={menuItemClass}
                  onClick={() => setShowDropdown(false)}
                >
                  <span class={menuItemContentClass}>
                    <Login2 class={menuIconClass} />
                    Login
                  </span>
                </a>
              )}
            {pathname !== "/logout" && pathname !== "/login" &&
              (
                <a
                  href="/logout"
                  class={menuItemClass}
                  onClick={() => setShowDropdown(false)}
                >
                  <span class={menuItemContentClass}>
                    <Logout class={menuIconClass} />
                    Logout
                  </span>
                </a>
              )}
          </div>
        )}
    </div>
  );
};
