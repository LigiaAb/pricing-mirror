"use client";

import React from "react";
import { DataTable } from "@/shared/components/data-table/data-table";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { ContenidoReporteProps } from "../lib/definir-reporte";

/** Fila envuelta: la tabla pide objetos y la fila de un reporte puede ser cualquier cosa. */
type FilaTabla<TFila> = { fila: TFila };

/** Contenido por defecto de la sección "Reporte": tabla con las columnas del reporte. */
export function TablaReporte<TFila>({ filas, columnas }: ContenidoReporteProps<TFila>) {
  const datos = React.useMemo(() => filas.map((fila) => ({ fila })), [filas]);
  const columnasTabla = React.useMemo<ColumnDef<FilaTabla<TFila>>[]>(
    () =>
      columnas.map((c) => ({
        id: c.id,
        header: c.label,
        accessorFn: (r: FilaTabla<TFila>) => c.valor(r.fila) ?? "",
      })),
    [columnas],
  );
  const numericas = React.useMemo(
    () =>
      columnas.filter((c) => c.numerica ?? (c.sumable || Boolean(c.calculada))).map((c) => c.id),
    [columnas],
  );
  const buscables = React.useMemo(
    () => columnas.filter((c) => c.buscable).map((c) => c.id),
    [columnas],
  );

  return (
    <DataTable
      columns={columnasTabla}
      data={datos}
      searchKeys={buscables}
      searchPlaceholder="Buscar…"
      numericColumns={numericas}
      showColumnToggle
      emptyMessage="No hay registros con los filtros elegidos."
    />
  );
}
