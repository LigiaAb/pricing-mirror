"use client";

import { Download, Eye, FileText, Route } from "lucide-react";
import * as React from "react";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { EncabezadoPaso } from "../../../shared/components/utils";
import { ACTIVIDADES_TRACKING } from "../../../shared/lib/actividades-tracking";
import type { ArchivoEmbarque, EmbarqueMaqueta } from "../../../shared/lib/tipos";
import { ARCHIVOS_MAQUETA } from "../../lib/datos-maqueta";
import { type PasoEmbarque, TRACKING_PASOS } from "../../lib/pasos";

/** Fila de la tabla: el archivo + textos para mostrar y buscar. */
type FilaArchivo = ArchivoEmbarque & {
  /** "OPS 5.3 · <actividad>" o "Tracking". */
  origenTexto: string;
  /** "3 · Bodega". */
  pasoTexto: string;
};

function aFila(archivo: ArchivoEmbarque): FilaArchivo {
  const actividad =
    archivo.origen === "actividad"
      ? ACTIVIDADES_TRACKING.find((item) => item.id === archivo.actividad)
      : undefined;
  const corto = TRACKING_PASOS.find((paso) => paso.id === archivo.paso)?.corto ?? "";
  return {
    ...archivo,
    origenTexto:
      archivo.origen === "tracking"
        ? "Tracking"
        : actividad
          ? `${actividad.id} · ${actividad.actividad}`
          : (archivo.actividad ?? "Actividad"),
    pasoTexto: `${archivo.paso} · ${corto}`,
  };
}

const COLUMNAS: ColumnDef<FilaArchivo>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Archivo" />,
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="break-all">{row.original.nombre}</span>
      </span>
    ),
  },
  {
    accessorKey: "tipo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    enableSorting: true,
  },
  {
    accessorKey: "origenTexto",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subido en" />,
    enableSorting: true,
    cell: ({ row }) =>
      row.original.origen === "tracking" ? (
        <span className="flex items-center gap-1">
          <Route className="size-4 shrink-0 text-primary" aria-hidden="true" />
          Tracking
        </span>
      ) : (
        row.original.origenTexto
      ),
  },
  {
    accessorKey: "pasoTexto",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Paso" />,
    enableSorting: true,
    cell: ({ row }) => <span className="text-nowrap">{row.original.pasoTexto}</span>,
  },
  {
    accessorKey: "usuario",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
    enableSorting: true,
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    enableSorting: true,
    cell: ({ row }) => <span className="text-nowrap">{row.original.fecha}</span>,
  },
  {
    id: "acciones",
    header: "Acciones",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        {/* Maqueta: se habilitan con la API de archivos. */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Ver ${row.original.nombre}`}
          disabled
        >
          <Eye className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Descargar ${row.original.nombre}`}
          disabled
        >
          <Download className="size-4" aria-hidden="true" />
        </Button>
      </div>
    ),
  },
];

/**
 * Archivos del embarque: solo lista para consulta y descarga.
 * No hay subida general: cada archivo se sube en la actividad que lo pide
 * (campos `archivo`) o en el tracking interactivo.
 */
export function PasoArchivos({
  paso,
  embarque,
}: {
  paso: PasoEmbarque;
  embarque: EmbarqueMaqueta;
}) {
  const filas = React.useMemo(
    () => (ARCHIVOS_MAQUETA[embarque.id] ?? []).map(aFila),
    [embarque.id],
  );

  return (
    <div className="space-y-4">
      <EncabezadoPaso titulo={paso.label} descripcion={paso.descripcion} />

      <DataTable
        title="Archivos del embarque"
        columns={COLUMNAS}
        data={filas}
        searchKeys={["nombre", "tipo", "origenTexto", "pasoTexto", "usuario", "fecha"]}
        searchPlaceholder="Buscar archivo…"
        emptyTitle="Sin archivos"
        emptyMessage="Este embarque aún no tiene archivos. Se suben en la actividad que los pide o en el tracking."
      />
    </div>
  );
}
