"use client";

import { ChevronDown, ListChecks } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import { actividadesDelPaso } from "../lib/actividades-tracking";
import { estadoPaso, TRACKING_PASOS } from "../lib/pasos";
import type { EmbarqueMaqueta, ResponsableTracking } from "../lib/tipos";
import { ListaActividades } from "./actividades-tracking";

/**
 * Sheet lateral con el detalle de actividades del Excel por paso y área.
 * Es independiente del Sheet de tracking interactivo (`tracking-sheet.tsx`),
 * que queda reservado para el componente existente.
 */
export function DetalleActividadesSheet({
  open,
  onOpenChange,
  embarque,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embarque: EmbarqueMaqueta | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l bg-card p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b bg-muted/40 px-4 py-5 pr-12 sm:px-6 sm:py-6 sm:pr-14">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ListChecks className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <SheetTitle>Actividades del tracking</SheetTitle>
              <SheetDescription>
                {embarque ? `File #${embarque.codFile} · ${embarque.cliente}` : "Sin embarque"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          {embarque ? <ActividadesPorPaso pasoActual={embarque.pasoActual} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const AREAS: readonly ResponsableTracking[] = ["OPS", "Bodega", "CBX"];

/** Maqueta del detalle: actividades del Excel por paso y por área. */
function ActividadesPorPaso({ pasoActual }: { pasoActual: number }) {
  return (
    <div className="space-y-3">
      {TRACKING_PASOS.map((paso) => {
        const estado = estadoPaso(paso.id, pasoActual);
        const actividades = actividadesDelPaso(paso.id);

        return (
          <details
            key={paso.id}
            open={estado === "actual"}
            className="group overflow-hidden rounded-lg border"
          >
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center gap-3 px-3 py-2",
                estado === "actual" && "bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  estado === "completado" && "bg-primary text-primary-foreground",
                  estado === "actual" && "border-2 border-primary text-primary",
                  estado === "pendiente" && "bg-muted text-muted-foreground",
                )}
              >
                {paso.id}
              </span>
              <span className="flex-1 text-sm font-medium">{paso.titulo}</span>
              <span className="text-xs text-muted-foreground">{actividades.length}</span>
              <ChevronDown
                className="size-4 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <div className="space-y-3 border-t p-3">
              <p className="text-xs text-muted-foreground">{paso.alcance}</p>
              {AREAS.map((area) => {
                const delArea = actividades.filter((actividad) => actividad.responsable === area);
                if (delArea.length === 0) return null;

                return (
                  <div key={area} className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {area}
                    </span>
                    <ListaActividades actividades={delArea} />
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
