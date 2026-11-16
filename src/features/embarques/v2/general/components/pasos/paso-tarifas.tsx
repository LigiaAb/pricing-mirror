"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dato, EncabezadoPaso, Pendiente } from "../utils";

export function PasoTarifas() {
  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Confirmación de tarifas"
        descripcion="Rubros de la cotización vinculada contra lo real del embarque."
        acciones={
          <Button type="button" size="sm" disabled>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Confirmar tarifas
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato label="Cotización" valor="—" />
        <Dato label="Total costo" valor="0.00" />
        <Dato label="Total venta" valor="0.00" />
        <Dato label="Profit" valor="0.00" />
      </div>

      <Pendiente className="min-h-56" texto="Tabla de rubros cotizados (costo / venta) y su confirmación." />
    </div>
  );
}
