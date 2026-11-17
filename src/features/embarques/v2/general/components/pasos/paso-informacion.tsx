"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CampoPorTipo } from "../../../shared/components/campos";
import { EncabezadoPaso, SoloConsulta } from "../../../shared/components/utils";
import {
  CAMPO_COD_FILE,
  CAMPOS_CONSIGNATARIO,
  CAMPOS_DETALLES,
  CAMPOS_FACTURACION,
  CAMPOS_FECHAS,
  CAMPOS_PRODUCTO,
  CAMPOS_RUTA,
  CAMPOS_SHIPPER,
  type CampoEmbarque,
} from "../../../shared/lib/campos-embarque";
import type { EmbarqueMaqueta } from "../../../shared/lib/tipos";

/**
 * Detalle completo del embarque (el resumen breve está siempre visible arriba).
 * Diseño de v2 (General · Partes · Ruta y carga); los campos son los del
 * módulo actual (`shared/lib/campos-embarque.ts`).
 * La ven todos los perfiles; solo Operaciones la edita (`editable`).
 */
export function PasoInformacion({
  embarque,
  editable = false,
}: {
  embarque: EmbarqueMaqueta;
  editable?: boolean | undefined;
}) {
  /** Datos de maqueta por clave del módulo actual. */
  const valores: Record<string, string> = {
    cod_file: embarque.codFile,
    cliente: embarque.cliente,
    codEntidadProv: embarque.carrier,
  };

  const campos = (prefijo: string, lista: readonly CampoEmbarque[]) =>
    lista.map((campo) => (
      <CampoPorTipo
        key={`${prefijo}-${campo.key}`}
        id={`emb-${prefijo}-${campo.key}`}
        campo={campo}
        valor={valores[campo.key]}
        soloLectura
      />
    ));

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
        {campos("general", [CAMPO_COD_FILE, ...CAMPOS_DETALLES])}
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">Partes</legend>
        <Subtitulo texto="Shipper" />
        {campos("shipper", CAMPOS_SHIPPER)}
        <Subtitulo texto="Consignatario" />
        {campos("consignatario", CAMPOS_CONSIGNATARIO)}
        <Subtitulo texto="Cliente (facturación)" />
        {campos("facturacion", CAMPOS_FACTURACION)}
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-1 text-sm font-semibold">Ruta y carga</legend>
        <Subtitulo texto="Ruta" />
        {campos("ruta", CAMPOS_RUTA)}
        <Subtitulo texto="Fechas" />
        {campos("fechas", CAMPOS_FECHAS)}
        <Subtitulo texto="Carga" />
        {campos("carga", CAMPOS_PRODUCTO)}
      </fieldset>
    </div>
  );
}

/** Separador dentro de un bloque (ocupa toda la fila). */
function Subtitulo({ texto }: { texto: string }) {
  return (
    <p className="col-span-full border-b pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {texto}
    </p>
  );
}
