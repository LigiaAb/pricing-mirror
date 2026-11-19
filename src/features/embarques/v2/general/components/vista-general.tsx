"use client";

import { MousePointerClick, TriangleAlert } from "lucide-react";
import * as React from "react";
import { useAuthStore } from "@/shared/stores/auth-store";
import { OperacionContext } from "../../shared/components/operacion-context";
import { AbrirTrackingContext } from "../../shared/components/tarjeta-actividad";
import type { EmbarqueMaqueta, PerfilEmbarque } from "../../shared/lib/tipos";
import { EMBARQUES_MAQUETA } from "../lib/datos-maqueta";
import { operacionDeEmbarque } from "../lib/registro-operaciones";
import { DetalleActividadesSheet } from "./detalle-actividades-sheet";
import { EmbarquesTable } from "./embarques-table";
import { ResumenEmbarque } from "./resumen-embarque";
import { TabsEmbarque } from "./tabs-embarque";
import { type ActualizarEstadoTracking, TrackingSheet } from "./tracking-sheet";

/* ==========================================================================
 * VISTA GENERAL DE EMBARQUES (SOLO MAQUETA)
 *
 * 1. Tabla de embarques.
 * 2. Resumen del seleccionado + tracking general (solo visual).
 * 3. Tabs con los pasos de gestión (según el perfil de la pantalla).
 * 4. Sheet lateral con el tracking interactivo existente (`TrackingDetalle`).
 * 5. Sheet lateral con el detalle de actividades del Excel (aparte).
 *
 * Pasos, tabs y actividades salen de la operación del embarque seleccionado
 * (`lib/registro-operaciones.ts`), que se entrega con `OperacionContext`.
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
  const authRaw = useAuthStore((state) => state.user);
  const [seleccionado, setSeleccionado] = React.useState<EmbarqueMaqueta | null>(null);
  const [tab, setTab] = React.useState("informacion");
  const [trackingOpen, setTrackingOpen] = React.useState(false);
  const [actividadesOpen, setActividadesOpen] = React.useState(false);

  // Asignacion de permisos quemados para pruebas configuradas segun peticion de usuarios
  const perfilQuemadoDePruebas: PerfilEmbarque =
    authRaw?.email === "mario.hernandez@cropa.com.gt"
      ? "operaciones"
      : authRaw?.email === "alejandro.calito@cropa.com.gt"
        ? "bodegas"
        : authRaw?.email === "estuardo.xocop@cropa.com.gt"
          ? "combex"
          : perfil;

  const abrirTracking = React.useCallback(() => setTrackingOpen(true), []);
  const operacion = seleccionado ? operacionDeEmbarque(seleccionado) : null;

  const seccionRef = React.useRef<HTMLDivElement | null>(null);

  const seleccionar = React.useCallback((embarque: EmbarqueMaqueta) => {
    setSeleccionado(embarque);
    setTab("informacion");
  }, []);

  React.useEffect(() => {
    if (!seleccionado) return;
    seccionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [seleccionado]);

  return (
    <OperacionContext value={operacion}>
      <div className="space-y-4 w-full">
        {/* ================================================================
          LISTADO
      ================================================================= */}
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <EmbarquesTable
            data={EMBARQUES_MAQUETA}
            seleccionado={seleccionado}
            onSeleccionar={seleccionar}
          />
        </section>

        {/* ================================================================
          EMBARQUE SELECCIONADO
      ================================================================= */}
        {seleccionado && operacion ? (
          <div ref={seccionRef} className="space-y-4">
            <ResumenEmbarque
              embarque={seleccionado}
              onVerTracking={() => setTrackingOpen(true)}
              onVerActividades={() => setActividadesOpen(true)}
            />

            <section className="rounded-lg border bg-card p-2 shadow-sm">
              <AbrirTrackingContext value={abrirTracking}>
                <TabsEmbarque
                  embarque={seleccionado}
                  perfil={perfilQuemadoDePruebas}
                  value={tab}
                  onValueChange={setTab}
                />
              </AbrirTrackingContext>
            </section>
          </div>
        ) : seleccionado ? (
          <div
            ref={seccionRef}
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted bg-card p-6 text-center text-sm text-muted-foreground"
          >
            <TriangleAlert className="size-5" aria-hidden="true" />
            La operación de este embarque ({seleccionado.tipoTransporte}) aún no tiene pasos ni
            actividades definidos.
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

        <DetalleActividadesSheet
          open={actividadesOpen}
          onOpenChange={setActividadesOpen}
          embarque={seleccionado}
          perfil={perfilQuemadoDePruebas}
        />
      </div>
    </OperacionContext>
  );
};
