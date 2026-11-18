"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type React from "react";
import { env } from "@/shared/config/env";

// Suppress the React 19 "script tag" warning in development
if (globalThis.window !== undefined && env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    orig.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: Readonly<React.ComponentProps<typeof NextThemesProvider>>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
