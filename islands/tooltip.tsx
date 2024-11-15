import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";

const Tooltip = (
  { children, tooltip, className }: {
    children: ComponentChildren;
    tooltip?: string;
    className?: string;
  },
) => {
  const [isVisible, setIsVisible] = useState(false);

  return tooltip
    ? (
      <div
        className={`relative inline-block `}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <div
            class={`z-10 absolute rounded border bg-white dark:bg-gray-900 transition-opacity duration-300 p-2 shadow-md flex items-center justify-center whitespace-nowrap ${className}`}
          >
            {tooltip}
          </div>
        )}
      </div>
    )
    : <>{children}</>;
};

export default Tooltip;
