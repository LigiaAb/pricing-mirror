"use client";

import { ChevronDown, ListChecks } from "lucide-react";
import { use } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import { ListaActividades } from "../../shared/components/actividades-tracking";
import { OperacionContext } from "../../shared/components/operacion-context";
import {
  actividadesDelPaso,
  type DefinicionOperacion,
  perfilDeResponsable,
  responsablesDe,
} from "../../shared/lib/operacion";
import type { EmbarqueMaqueta, PerfilEmbarque } from "../../shared/lib/tipos";
import { estadoPaso } from "../lib/pasos";

/**
 * Sheet lateral con el detalle de actividades del Excel por paso y área.
 * Es independiente del Sheet de tracking interactivo (`tracking-sheet.tsx`),
 * que queda reservado para el componente existente.
 * Operaciones ve todas las áreas; Bodegas y Combex solo la suya.
 */
export function DetalleActividadesSheet({
  open,
  onOpenChange,
  embarque,
  perfil,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embarque: EmbarqueMaqueta | null;
  perfil: PerfilEmbarque;
}) {
  const operacion = use(OperacionContext);

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
          {embarque && operacion ? (
            <ActividadesPorPaso
              operacion={operacion}
              pasoActual={embarque.pasoActual}
              perfil={perfil}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Maqueta del detalle: actividades de la operación por paso y por área. */
function ActividadesPorPaso({
  operacion,
  pasoActual,
  perfil,
}: {
  operacion: DefinicionOperacion;
  pasoActual: number;
  perfil: PerfilEmbarque;
}) {
  const areas = responsablesDe(operacion).filter(
    (area) => perfil === "operaciones" || perfilDeResponsable(operacion, area) === perfil,
  );

  return (
    <div className="space-y-3">
      {operacion.pasos.map((paso) => {
        const estado = estadoPaso(paso.id, pasoActual);
        const actividades = actividadesDelPaso(operacion, paso.id).filter((actividad) =>
          areas.includes(actividad.responsable),
        );
        if (actividades.length === 0) return null;

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
              {areas.map((area) => {
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
