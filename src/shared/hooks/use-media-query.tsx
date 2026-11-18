"use client";

import * as React from "react";

/**
 * Hook genérico para detectar media queries
 * @param query - Media query CSS a evaluar
 * @param defaultValue - Valor por defecto durante SSR
 * @returns boolean indicando si la media query coincide
 */
export function useMediaQuery(query: string, defaultValue = false) {
  const [matches, setMatches] = React.useState(defaultValue);

  React.useEffect(() => {
    const mediaQuery = globalThis.matchMedia(query);

    // Actualizar el estado inicial
    setMatches(mediaQuery.matches);

    // Función para manejar cambios
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Escuchar cambios en la media query
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
