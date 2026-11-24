"use client";

import { X } from "lucide-react";

/** "x" al final del input para dejar el filtro vacío (mismo patrón que `ComboboxOpcion`). */
export function BotonLimpiar({ label, onClick }: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <button
      type="button"
      aria-label={`Limpiar ${label}`}
      title="Limpiar"
      tabIndex={-1}
      className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}
