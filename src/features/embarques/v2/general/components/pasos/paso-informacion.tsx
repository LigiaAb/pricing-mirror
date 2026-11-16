"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CampoMaqueta, EncabezadoPaso, SoloConsulta } from "../../../shared/components/utils";
import type { EmbarqueMaqueta } from "../../../shared/lib/tipos";

/**
 * Detalle completo del embarque (el resumen breve está siempre visible arriba).
 * La ven todos los perfiles; solo Operaciones la edita (`editable`).
 */
export function PasoInformacion({ embarque, editable }: { embarque: EmbarqueMaqueta; editable: boolean }) {
  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Información del embarque"
        descripcion="Datos generales, partes y carga."
        acciones={
          editable ? (
            <Button type="button" size="sm" variant="outline" disabled>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
          ) : (
            <SoloConsulta />
          )
        }
      />

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">General</legend>
        <CampoMaqueta id="emb-file" label="Código de file" valor={embarque.codFile} />
        <CampoMaqueta id="emb-transporte" label="Tipo de transporte" valor={embarque.tipoTransporte} />
        <CampoMaqueta id="emb-servicio" label="Tipo de servicio" />
        <CampoMaqueta id="emb-incoterm" label="Incoterm" />
        <CampoMaqueta id="emb-cotizacion" label="Cotización" />
        <CampoMaqueta id="emb-ejecutivo" label="Ejecutivo" />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">Partes</legend>
        <CampoMaqueta id="emb-cliente" label="Cliente" valor={embarque.cliente} />
        <CampoMaqueta id="emb-shipper" label="Shipper" />
        <CampoMaqueta id="emb-consignee" label="Consignee" />
        <CampoMaqueta id="emb-carrier" label="Carrier" valor={embarque.carrier} />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">Ruta y carga</legend>
        <CampoMaqueta id="emb-origen" label="Origen" valor={embarque.origen} />
        <CampoMaqueta id="emb-destino" label="Destino" valor={embarque.destino} />
        <CampoMaqueta id="emb-etd" label="ETD" valor={embarque.etd} />
        <CampoMaqueta id="emb-eta" label="ETA" valor={embarque.eta} />
        <CampoMaqueta id="emb-commodity" label="Commodity" />
        <CampoMaqueta id="emb-bultos" label="Bultos" tipo="number" />
        <CampoMaqueta id="emb-peso" label="Peso (kg)" tipo="number" />
        <CampoMaqueta id="emb-volumen" label="Volumen (m³)" tipo="number" />
      </fieldset>
    </div>
  );
}
