"use client";

import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CampoMaqueta, EncabezadoPaso, Pendiente } from "../utils";

export function PasoReservas() {
  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Reservas"
        descripcion="Solicitud de reserva al carrier y su confirmación."
        acciones={
          <>
            <Button type="button" size="sm" variant="outline" disabled>
              <Send className="size-4" aria-hidden="true" />
              Solicitar reserva
            </Button>
            <Button type="button" size="sm" disabled>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Confirmar reserva
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">Solicitud</legend>
          <CampoMaqueta id="res-carrier" label="Carrier" requerido />
          <CampoMaqueta id="res-fecha-solicitud" label="Fecha de solicitud" tipo="date" />
          <CampoMaqueta id="res-equipo" label="Equipo / espacio" />
          <CampoMaqueta id="res-cut-off" label="Cut-off" tipo="date" />
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">Confirmación</legend>
          <CampoMaqueta id="res-booking" label="No. de booking" />
          <CampoMaqueta id="res-fecha-confirmacion" label="Fecha de confirmación" tipo="date" />
          <CampoMaqueta id="res-buque" label="Buque / vuelo" />
          <CampoMaqueta id="res-viaje" label="Viaje" />
        </fieldset>
      </div>

      <Pendiente texto="Historial de solicitudes y confirmaciones de reserva." />
    </div>
  );
}
