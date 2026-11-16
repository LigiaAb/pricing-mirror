"use client";

import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CampoMaqueta, EncabezadoPaso, Pendiente } from "../utils";

export function PasoGuias() {
  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Asignación de guías"
        descripcion="Asignación de HAWB y registro de MAWB (sin duplicados ni saltos de correlativo)."
        acciones={
          <Button type="button" size="sm" disabled>
            <Plus className="size-4" aria-hidden="true" />
            Asignar guía
          </Button>
        }
      />

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">MAWB</legend>
        <CampoMaqueta id="guia-tipo" label="Tipo de guía" requerido />
        <CampoMaqueta id="guia-numero" label="Número" requerido />
        <CampoMaqueta id="guia-fecha" label="Fecha de emisión" tipo="date" />
        <CampoMaqueta id="guia-carrier" label="Carrier" />
      </fieldset>

      <Pendiente texto="Tabla de HAWB asignadas." />
    </div>
  );
}
