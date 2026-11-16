"use client";

import { FileUp, ListChecks, Route } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { EmbarqueMaqueta } from "../lib/tipos";
import { TrackingGeneral } from "./tracking-general";
import { Dato, SeccionEmbarque } from "./utils";

/**
 * Información breve del embarque seleccionado + tracking general.
 * Siempre visible arriba de las tabs.
 */
export function ResumenEmbarque({
  embarque,
  onVerTracking,
  onVerActividades,
  onSubirDocumentos,
}: {
  embarque: EmbarqueMaqueta;
  onVerTracking: () => void;
  onVerActividades: () => void;
  onSubirDocumentos: () => void;
}) {
  return (
    <section className="space-y-4">
      {/* Franja del seleccionado (igual que "Cotización" en Gestión de Cotizaciones) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-card px-4 py-3 shadow-sm">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            File
          </span>
          <p className="text-lg font-semibold">#{embarque.codFile}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {embarque.estado}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={onSubirDocumentos}>
            <FileUp className="size-4" aria-hidden="true" />
            Documentos
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onVerActividades}>
            <ListChecks className="size-4" aria-hidden="true" />
            Actividades
          </Button>
          <Button type="button" size="sm" onClick={onVerTracking}>
            <Route className="size-4" aria-hidden="true" />
            Tracking
          </Button>
        </div>
      </div>

      <SeccionEmbarque titulo="Información general">
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Dato label="Id" valor={embarque.id} />
          <Dato label="Cliente" valor={embarque.cliente} />
          <Dato label="Transporte" valor={embarque.tipoTransporte} />
          <Dato label="Origen" valor={embarque.origen} />
          <Dato label="Destino" valor={embarque.destino} />
          <Dato label="Carrier" valor={embarque.carrier} />
          <Dato label="ETD" valor={embarque.etd} />
          <Dato label="ETA" valor={embarque.eta} />
        </div>

        <div className="border-t px-4">
          <span className="block pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tracking general
          </span>
          <TrackingGeneral pasoActual={embarque.pasoActual} />
        </div>
      </SeccionEmbarque>
    </section>
  );
}
