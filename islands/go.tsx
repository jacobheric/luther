import { useEffect, useState } from "preact/hooks";

export const Go = () => {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSubmitting(false);
    document.getElementById("prompt")?.addEventListener(
      "submit",
      () => setSubmitting(true),
    );
  }, []);

  return (
    <button
      disabled={submitting}
      type="submit"
    >
      <div
        className={submitting ? "animate-spin" : ""}
      >
        Go
      </div>
    </button>
  );
};
