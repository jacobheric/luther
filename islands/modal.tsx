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
      className="p-4 mx-auto mt-16 rounded"
      onClick={(e) => {
        const dialog = e.target as HTMLDialogElement;
        if (dialog.tagName === "DIALOG") {
          dialog.close();
        }
      }}
    >
      <div className="flex flex-col items-start justify-start w-full h-full gap-4">
        <div className="flex flex-row justify-between items-center min-w-96">
          <h3 className="font-bold text-lg">{title}</h3>
          <X
            className="w-5 h-5 cursor-pointer"
            onClick={() => dialogRef.current?.close()}
          />
        </div>
        {open && children}
      </div>
    </dialog>
  );
};
