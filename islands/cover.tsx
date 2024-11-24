import { type Image } from "@spotify/web-api-ts-sdk";
import { useEffect, useRef, useState } from "preact/hooks";

export const Cover = (
  { images }: { images: Image[] },
) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showDropdown]);

  return (
    <div
      ref={dropdownRef}
      class="relative flex flex-row items-center cursor-pointer"
      onClick={() => setShowDropdown(!showDropdown)}
    >
      <img
        className="object-fill rounded"
        src={images.find((i: Image) => i.height === 300)?.url}
      />

      {showDropdown && (
        <div class="fixed inset-0 z-10 flex items-center justify-center p-4">
          <div class="relative max-w-[640px] bg-transparent rounded">
            <img
              className="w-auto max-w-full max-h-[90vh] object-contain rounded border shadow-md"
              src={images.find((i: Image) => i.height === 640)?.url}
            />
          </div>
        </div>
      )}
    </div>
  );
};
