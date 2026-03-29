import type { ComponentChildren } from "preact";
import { Logo } from "@/components/logo.tsx";

export const AuthShell = (
  {
    title,
    body,
    children,
  }: {
    title: string;
    body?: string;
    children: ComponentChildren;
  },
) => (
  <div class="min-h-[calc(100vh-3.5rem)] w-full flex items-center justify-center py-10 px-4">
    <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white/90 dark:bg-gray-900/90 shadow-sm backdrop-blur">
      <div class="px-6 pt-6 pb-5 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <Logo className="w-4 h-4 fill-black dark:fill-white" />
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-medium leading-tight">{title}</h1>
            {body && (
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {body}
              </p>
            )}
          </div>
        </div>
      </div>
      <div class="px-6 py-5">
        {children}
      </div>
    </div>
  </div>
);
