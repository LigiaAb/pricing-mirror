"use client";

import { Pencil } from "lucide-react";
import type * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
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
 * Cada bloque es un acordeón: General abre por defecto, el resto se abre
 * solo cuando se necesita (ahorra espacio).
 */
export function PasoInformacion({ embarque, editable }: { embarque: EmbarqueMaqueta; editable: boolean }) {
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

      <Accordion type="multiple" defaultValue={["general"]} className="space-y-3">
        <BloqueInformacion valor="general" titulo="General" total={1 + CAMPOS_DETALLES.length}>
          {campos("general", [CAMPO_COD_FILE, ...CAMPOS_DETALLES])}
        </BloqueInformacion>

        <BloqueInformacion
          valor="partes"
          titulo="Partes"
          total={CAMPOS_SHIPPER.length + CAMPOS_CONSIGNATARIO.length + CAMPOS_FACTURACION.length}
        >
          <Subtitulo texto="Shipper" />
          {campos("shipper", CAMPOS_SHIPPER)}
          <Subtitulo texto="Consignatario" />
          {campos("consignatario", CAMPOS_CONSIGNATARIO)}
          <Subtitulo texto="Cliente (facturación)" />
          {campos("facturacion", CAMPOS_FACTURACION)}
        </BloqueInformacion>

        <BloqueInformacion
          valor="ruta-carga"
          titulo="Ruta y carga"
          total={CAMPOS_RUTA.length + CAMPOS_FECHAS.length + CAMPOS_PRODUCTO.length}
        >
          <Subtitulo texto="Ruta" />
          {campos("ruta", CAMPOS_RUTA)}
          <Subtitulo texto="Fechas" />
          {campos("fechas", CAMPOS_FECHAS)}
          <Subtitulo texto="Carga" />
          {campos("carga", CAMPOS_PRODUCTO)}
        </BloqueInformacion>
      </Accordion>
    </div>
  );
}

/** Bloque plegable de campos (mismo marco que tenía el `fieldset`). */
function BloqueInformacion({
  valor,
  titulo,
  total,
  children,
}: {
  valor: string;
  titulo: string;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={valor} className="rounded-lg border last:border-b">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <span className="flex items-baseline gap-2 text-sm font-semibold">
          {titulo}
          <span className="text-xs font-normal text-muted-foreground">{total} campos</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </AccordionContent>
    </AccordionItem>
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
