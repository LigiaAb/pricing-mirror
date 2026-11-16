"use client";

import { Route } from "lucide-react";
import * as React from "react";
import { type ActualizarEstadoTrackingPayload, TrackingDetalle } from "@/features/tracking";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import type { CoordinacionTracking, EmbarqueMaqueta } from "../lib/tipos";

/** Lo que la pantalla hace al mover el tracking (actualizar estado y reconsultar). */
export type ActualizarEstadoTracking = (
  embarque: CoordinacionTracking,
  payload: ActualizarEstadoTrackingPayload,
) => void | Promise<void>;

/**
 * Sheet lateral con el tracking interactivo existente (`TrackingDetalle` de
 * `@/features/tracking`). No agregar otro contenido aquí.
 *
 * - Datos del embarque seleccionado (`CoordinacionTracking`).
 * - `codTipo`: tipo de tracking, lo pasa la pantalla.
 * - `onActualizarEstado`: la pantalla actualiza el estado (API) y reconsulta.
 * - No se permite retroceder (`puedeRetroceder={false}`).
 * - Mientras se guarda, el componente queda `ocupado`.
 */
export function TrackingSheet({
  open,
  onOpenChange,
  embarque,
  codTipo,
  onActualizarEstado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embarque: EmbarqueMaqueta | null;
  codTipo: number;
  onActualizarEstado?: ActualizarEstadoTracking | undefined;
}) {
  const [ocupado, setOcupado] = React.useState(false);

  const actualizar = async (payload: ActualizarEstadoTrackingPayload) => {
    if (!embarque || !onActualizarEstado) return;
    setOcupado(true);
    try {
      await onActualizarEstado(embarque, payload);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l bg-card p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b bg-muted/40 px-4 py-5 pr-12 sm:px-6 sm:py-6 sm:pr-14">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Route className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <SheetTitle>Tracking</SheetTitle>
              <SheetDescription>
                {embarque ? `File #${embarque.codFile} · ${embarque.cliente}` : "Sin embarque"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          {embarque ? (
            <TrackingDetalle
              codInterno={embarque.seg_coord_id ?? 0}
              codTipo={codTipo}
              estadoActual={embarque.estado_id_tracking ?? 0}
              puedeRetroceder={false}
              ocupado={ocupado}
              onActualizarEstado={actualizar}
              coordinacionId={embarque.coordinacion}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
