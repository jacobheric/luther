import { useState } from "preact/hooks";
import { ComponentChildren } from "preact";

const Tooltip = (
  { children, tooltip }: { children: ComponentChildren; tooltip?: string },
) => {
  const [isVisible, setIsVisible] = useState(false);

  return tooltip
    ? (
      <div
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <div class="absolute top-14 right-2 rounded border bg-white dark:bg-gray-900 transition-opacity duration-300 p-2 shadow flex items-center justify-center whitespace-nowrap">
            {tooltip}
          </div>
        )}
      </div>
    )
    : <>{children}</>;
};

export default Tooltip;
