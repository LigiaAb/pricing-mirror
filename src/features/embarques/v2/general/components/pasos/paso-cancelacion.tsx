"use client";

import { AlertTriangle, Ban } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CampoMaqueta, EncabezadoPaso } from "../utils";

/** Cancelación / anulación del embarque (opcional). */
export function PasoCancelacion() {
  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Cancelación o anulación"
        descripcion="Opcional. Detiene el flujo del embarque."
      />

      <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p className="text-sm">
          Al cancelar o anular, el embarque deja de avanzar en el tracking y queda solo para
          consulta.
        </p>
      </div>

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-destructive/40 p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold text-destructive">Datos</legend>
        <CampoMaqueta id="can-tipo" label="Tipo (cancelación / anulación)" requerido />
        <CampoMaqueta id="can-motivo" label="Motivo" requerido />
        <CampoMaqueta id="can-observaciones" label="Observaciones" className="sm:col-span-2" />
      </fieldset>

      <div className="flex justify-end">
        <Button type="button" variant="destructive" disabled>
          <Ban className="size-4" aria-hidden="true" />
          Cancelar embarque
        </Button>
      </div>
    </div>
  );
}
