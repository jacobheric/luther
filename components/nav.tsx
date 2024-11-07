export default function Nav() {
  return (
    <div class="relative">
      <input type="checkbox" id="menu-toggle" class="hidden peer" />

      <label
        for="menu-toggle"
        class="flex flex-col items-center justify-center w-10 h-10 rounded cursor-pointer"
      >
        <span class="block w-5 h-0.5 bg-gray-700 mb-1"></span>
        <span class="block w-5 h-0.5 bg-gray-700 mb-1"></span>
        <span class="block w-5 h-0.5 bg-gray-700"></span>
      </label>

      <div class="absolute top-12 right-2 bg-white shadow-lg rounded w-32 hidden peer-checked:block">
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
    </div>
  );
}
