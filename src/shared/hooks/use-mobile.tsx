"use client";

import { useMediaQuery } from "./use-media-query";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook para detectar si el dispositivo es móvil
 * Usa el breakpoint estándar de Tailwind (md = 768px)
 * @returns boolean indicando si el viewport es móvil
 */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
