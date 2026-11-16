"use client";

import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { estadoPaso, TRACKING_PASOS } from "../lib/pasos";

/**
 * Tracking general de 6 pasos. Solo visual: no es interactivo.
 * El interactivo vive en el Sheet de `tracking-sheet.tsx`.
 */
export function TrackingGeneral({ pasoActual }: { pasoActual: number }) {
  return (
    <ol className="flex w-full items-start overflow-x-auto px-2 py-4" aria-label="Tracking general">
      {TRACKING_PASOS.map((paso, index) => {
        const estado = estadoPaso(paso.id, pasoActual);
        const esUltimo = index === TRACKING_PASOS.length - 1;

        return (
          <React.Fragment key={paso.id}>
            <li
              className="flex min-w-24 flex-col items-center gap-1 text-center"
              aria-current={estado === "actual" ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  estado === "completado" && "border-primary bg-primary text-primary-foreground",
                  estado === "actual" && "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                  estado === "pendiente" && "border-muted bg-muted text-muted-foreground",
                )}
              >
                {estado === "completado" ? <Check className="size-5" aria-hidden="true" /> : paso.id}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  estado === "pendiente" && "text-muted-foreground",
                )}
              >
                {paso.titulo}
              </span>
              <span className="text-[11px] text-muted-foreground">{paso.descripcion}</span>
            </li>

            {esUltimo ? null : (
              <li
                aria-hidden="true"
                className={cn(
                  "mt-5 h-0.5 min-w-6 flex-1 rounded",
                  paso.id < pasoActual ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}
