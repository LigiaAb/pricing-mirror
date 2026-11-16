"use client";

import { Circle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ActividadTracking, TipoActividad } from "../lib/actividades-tracking";

const ESTILO_TIPO: Record<TipoActividad, string> = {
  Principal: "border-primary/40 bg-primary/10 text-primary",
  Opcional: "border-muted text-muted-foreground",
  Condicional: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Excepción: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  Transversal: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

/**
 * Lista de actividades del Excel (código, área, actividad, resultado, tipo y
 * control). Solo maqueta: el círculo será el check cuando haya funcionalidad.
 */
export function ListaActividades({
  actividades,
  className,
}: {
  actividades: readonly ActividadTracking[];
  className?: string | undefined;
}) {
  return (
    <ul className={cn("divide-y rounded-lg border", className)}>
      {actividades.map((actividad) => (
        <li key={actividad.id} className="flex items-start gap-3 px-3 py-2">
          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">
                {actividad.id}
              </span>
              <span className="text-sm font-medium">{actividad.actividad}</span>
              <span
                className={cn(
                  "rounded-full border px-2 text-[10px] font-medium",
                  ESTILO_TIPO[actividad.tipo],
                )}
              >
                {actividad.tipo}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {actividad.proceso} · Resultado: {actividad.resultado}
            </p>
            <p className="text-[11px] text-muted-foreground">Control: {actividad.control}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
