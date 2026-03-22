import X from "tabler-icons/tsx/x.tsx";
import { type ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

export const Modal = (
  { id, title, children }: {
    id: string;
    title: string;
    children: ComponentChildren;
  },
) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    //
    //Poor man's lazy rendering for our react children
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "open") {
          setOpen(dialog.hasAttribute("open"));
        }
      });
    });

    observer.observe(dialog, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className="w-full h-full max-w-none max-h-none p-3 sm:p-6 bg-transparent backdrop:bg-black/30 outline-none"
      onClick={(e) => {
        const dialog = e.target as HTMLDialogElement;
        if (dialog.tagName === "DIALOG") {
          dialog.close();
        }
      }}
    >
      <div className="mx-auto w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/70 dark:border-gray-800 rounded-xl backdrop-blur-sm shadow-xl flex flex-col gap-3 p-3">
        <div className="flex flex-row justify-between items-center w-full border-b border-gray-200/70 dark:border-gray-800 pb-2">
          <h3 className="font-semibold text-sm dark:text-white text-gray-900">
            {title}
          </h3>
          <button
            type="button"
            className="cursor-pointer !p-0 h-7 w-7 inline-flex items-center justify-center !border-0 !bg-transparent !rounded-none text-gray-500 hover:text-gray-900 dark:hover:text-white"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close modal"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
};
