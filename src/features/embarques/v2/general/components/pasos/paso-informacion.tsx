"use client";

import { parse } from "date-fns";
import { Pencil } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CampoCatalogo, CampoFecha, CampoTexto } from "../../../shared/components/campos";
import { EncabezadoPaso, SoloConsulta } from "../../../shared/components/utils";
import type { EmbarqueMaqueta } from "../../../shared/lib/tipos";

/** Fecha de la maqueta (`dd-MM-yyyy`) → Date. */
function fechaMaqueta(valor: string): Date | undefined {
  const fecha = parse(valor, "dd-MM-yyyy", new Date());
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/**
 * Detalle completo del embarque (el resumen breve está siempre visible arriba).
 * La ven todos los perfiles; solo Operaciones la edita (`editable`, con el
 * botón Editar). Mientras no se edita, los campos quedan en solo lectura.
 */
export function PasoInformacion({ embarque, editable }: { embarque: EmbarqueMaqueta; editable: boolean }) {
  const ro = { soloLectura: true };
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
        <CampoTexto {...ro} id="emb-file" label="Código de file" valor={embarque.codFile} />
        <CampoCatalogo {...ro} id="emb-transporte" label="Tipo de transporte" valor={embarque.tipoTransporte} />
        <CampoCatalogo {...ro} id="emb-servicio" label="Tipo de servicio" />
        <CampoCatalogo {...ro} id="emb-incoterm" label="Incoterm" />
        <CampoTexto {...ro} id="emb-cotizacion" label="Cotización" />
        <CampoCatalogo {...ro} id="emb-ejecutivo" label="Ejecutivo" />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">Partes</legend>
        <CampoCatalogo {...ro} id="emb-cliente" label="Cliente" valor={embarque.cliente} />
        <CampoCatalogo {...ro} id="emb-shipper" label="Shipper" />
        <CampoCatalogo {...ro} id="emb-consignee" label="Consignee" />
        <CampoCatalogo {...ro} id="emb-carrier" label="Carrier" valor={embarque.carrier} />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">Ruta y carga</legend>
        <CampoCatalogo {...ro} id="emb-origen" label="Origen" valor={embarque.origen} />
        <CampoCatalogo {...ro} id="emb-destino" label="Destino" valor={embarque.destino} />
        <CampoFecha {...ro} id="emb-etd" label="ETD" valor={fechaMaqueta(embarque.etd)} />
        <CampoFecha {...ro} id="emb-eta" label="ETA" valor={fechaMaqueta(embarque.eta)} />
        <CampoCatalogo {...ro} id="emb-commodity" label="Commodity" />
        <CampoTexto {...ro} id="emb-bultos" label="Bultos" tipo="number" />
        <CampoTexto {...ro} id="emb-peso" label="Peso (kg)" tipo="number" />
        <CampoTexto {...ro} id="emb-volumen" label="Volumen (m³)" tipo="number" />
      </fieldset>
    </div>
  );
}
