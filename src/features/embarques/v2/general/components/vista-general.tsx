"use client";

import { MousePointerClick } from "lucide-react";
import * as React from "react";
import type { EmbarqueMaqueta, PerfilEmbarque } from "../../shared/lib/tipos";
import { EMBARQUES_MAQUETA } from "../lib/datos-maqueta";
import { pasosDelPerfil, type ValorPasoEmbarque } from "../lib/pasos";
import { DetalleActividadesSheet } from "./detalle-actividades-sheet";
import { EmbarquesTable } from "./embarques-table";
import { ResumenEmbarque } from "./resumen-embarque";
import { TabsEmbarque } from "./tabs-embarque";
import { type ActualizarEstadoTracking, TrackingSheet } from "./tracking-sheet";

/* ==========================================================================
 * VISTA GENERAL DE EMBARQUES (SOLO MAQUETA)
 *
 * 1. Tabla de embarques.
 * 2. Resumen del seleccionado + tracking general de 6 pasos (solo visual).
 * 3. Tabs con los pasos de gestión (según el perfil de la pantalla).
 * 4. Sheet lateral con el tracking interactivo existente (`TrackingDetalle`).
 * 5. Sheet lateral con el detalle de actividades del Excel (aparte).
 *
 * `perfil` permite reutilizar la vista en Operaciones, Bodegas y Combex.
 * Sin API todavía: usa datos de `lib/datos-maqueta.ts`.
 * ========================================================================== */

type VistaGeneralProps = {
  perfil?: PerfilEmbarque;
  /** Tipo de tracking para `TrackingDetalle` (en la pantalla original: `tracking?.codTipo`). */
  codTipoTracking?: number;
  /**
   * Al mover el tracking: la pantalla actualiza el estado (API) y reconsulta.
   * Recibe el embarque seleccionado y el movimiento.
   */
  onActualizarEstadoTracking?: ActualizarEstadoTracking;
};

export const VistaGeneral = ({
  perfil = "operaciones",
  codTipoTracking = 0,
  onActualizarEstadoTracking,
}: VistaGeneralProps) => {
  const [seleccionado, setSeleccionado] = React.useState<EmbarqueMaqueta | null>(null);
  const [tab, setTab] = React.useState<ValorPasoEmbarque>("informacion");
  const [trackingOpen, setTrackingOpen] = React.useState(false);
  const [actividadesOpen, setActividadesOpen] = React.useState(false);

  const seccionRef = React.useRef<HTMLDivElement | null>(null);
  const veDocumentos = pasosDelPerfil(perfil).some((paso) => paso.value === "documentos");

  const seleccionar = React.useCallback((embarque: EmbarqueMaqueta) => {
    setSeleccionado(embarque);
    setTab("informacion");
  }, []);

  React.useEffect(() => {
    if (!seleccionado) return;
    seccionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [seleccionado]);

  return (
    <div className="space-y-4 w-full">
      {/* ================================================================
          LISTADO
      ================================================================= */}
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <EmbarquesTable data={EMBARQUES_MAQUETA} seleccionado={seleccionado} onSeleccionar={seleccionar} />
      </section>

      {/* ================================================================
          EMBARQUE SELECCIONADO
      ================================================================= */}
      {seleccionado ? (
        <div ref={seccionRef} className="space-y-4">
          <ResumenEmbarque
            embarque={seleccionado}
            onVerTracking={() => setTrackingOpen(true)}
            onVerActividades={() => setActividadesOpen(true)}
            onSubirDocumentos={veDocumentos ? () => setTab("documentos") : undefined}
          />

          <section className="rounded-lg border bg-card p-2 shadow-sm">
            <TabsEmbarque embarque={seleccionado} perfil={perfil} value={tab} onValueChange={setTab} />
          </section>
        </div>
      ) : (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted bg-card p-6 text-sm text-muted-foreground">
          <MousePointerClick className="size-5" aria-hidden="true" />
          Seleccione un embarque de la tabla para ver su información.
        </div>
      )}

      <TrackingSheet
        open={trackingOpen}
        onOpenChange={setTrackingOpen}
        embarque={seleccionado}
        codTipo={codTipoTracking}
        onActualizarEstado={onActualizarEstadoTracking}
      />

      <DetalleActividadesSheet open={actividadesOpen} onOpenChange={setActividadesOpen} embarque={seleccionado} perfil={perfil} />
    </div>
  );
};
