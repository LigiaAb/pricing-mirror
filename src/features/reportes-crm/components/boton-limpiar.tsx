"use client";

import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/** "x" al final del input para dejar el filtro vacío (mismo patrón que `ComboboxOpcion`). */
export function BotonLimpiar({
  label,
  onClick,
  className,
}: Readonly<{
  label: string;
  onClick: () => void;
  /** Posición vertical si el input no ocupa todo el contenedor (default: centrado). */
  className?: string | undefined;
}>) {
  return (
    <button
      type="button"
      aria-label={`Limpiar ${label}`}
      title="Limpiar"
      tabIndex={-1}
      className={cn(
        "absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive",
        className,
      )}
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
