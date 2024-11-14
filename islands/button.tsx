import Loader2 from "tabler-icons/tsx/loader-2.tsx";
import Check from "tabler-icons/tsx/check.tsx";
import ExclamationMark from "tabler-icons/tsx/exclamation-mark.tsx";
import { useEffect, useState } from "preact/hooks";

import { ButtonHTMLAttributes } from "preact/compat";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  submitting?: boolean;
  success?: boolean;
  error?: boolean;
}

export const Button = (
  {
    children,
    className,
    submitting,
    success: incomingSuccess,
    error: incomingError,
    ...props
  }: ButtonProps,
) => {
  const [error, setError] = useState(incomingError);
  const [success, setSuccess] = useState(incomingSuccess);

  useEffect(() => {
    if (error) {
      setTimeout(() => setError(false), 3000);
    }
    if (success) {
      setTimeout(() => setSuccess(false), 3000);
    }
  }, []);

  return (
    <button className={`relative ${className || ""}`} {...props}>
      <div className="absolute inset-0 flex items-center justify-center">
        {submitting
          ? <Loader2 className="animate-spin" />
          : success
          ? <Check />
          : error
          ? <ExclamationMark />
          : null}
      </div>

      <div
        className={submitting || success || error ? "invisible" : "visible"}
      >
        {children}
      </div>
    </button>
  );
};
