import { useEffect, useRef, useState } from "preact/hooks";

export const Nav = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const clickAway = (event: any) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", clickAway);
    return () => {
      document.removeEventListener("mousedown", clickAway);
    };
  }, [dropdownRef]);

  return (
    <div
      ref={dropdownRef}
      class="relative flex flex-row items-center"
      onClick={() => setShowDropdown(!showDropdown)}
    >
      <div class="flex flex-col items-center justify-center w-10 h-4 rounded cursor-pointer">
        <span class="block w-5 h-0.5 bg-gray-700 mb-1"></span>
        <span class="block w-5 h-0.5 bg-gray-700 mb-1"></span>
        <span class="block w-5 h-0.5 bg-gray-700"></span>
      </div>

      {showDropdown &&
        (
          <div class="absolute top-8 right-2 bg-white rounded w-32 border border-gray-200">
            <a
              href="/"
              class="block px-4 py-3 text-gray-700 hover:bg-gray-100 no-underline"
            >
              Home
            </a>
            <a
              href="/about"
              class="block px-4 py-3 text-gray-700 hover:bg-gray-100 no-underline"
            >
              About
            </a>
            <a
              href="/login"
              class="block px-4 py-3 text-gray-700 hover:bg-gray-100 no-underline"
            >
              Login
            </a>
            <a
              href="/logout"
              class="block px-4 py-3 text-gray-700 hover:bg-gray-100 no-underline"
            >
              Logout
            </a>
          </div>
        )}
    </div>
  );
};
