"use client";

import { Eye } from "lucide-react";
import * as React from "react";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { OriginalSpot, TarifaSpotFila } from "../api/autorizacion-spot";

type Id = string | number;

export type FilaTarifaSpot = TarifaSpotFila & {
  cod_cotizacion_cabecera?: Id | null;
  version?: string | number | null;
  entidad_nombre?: string | null;
  tipo_transporte: string;
  tipo_servicio: string;
  tipo_carga: string;
  tipo_pago: string;
  clasificacion_carga: string;
  solicitante: string;
  autorizador: string;
  reason_code_nombre: string;
  /** Se completa al abrir el detalle (rubro SPOT guardado en la versión). */
  original?: OriginalSpot | null;
};

type TablaTarifasSpotProps = {
  data: FilaTarifaSpot[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  mostrarAutorizados: boolean;
  onAlternarAutorizados: () => void;
  onSeleccionar: (fila: FilaTarifaSpot) => void;
};

const SEARCH_KEYS = ["cod_cotizacion_cabecera", "entidad_nombre", "solicitante"];

/*
 * Tabla separada y memoizada: seleccionar una fila (y lo que llega después: CW,
 * original, documento) solo cambia el detalle de la pantalla padre. Mientras
 * `data` y los callbacks conserven su referencia, la tabla no se vuelve a dibujar
 * ni pierde su página, orden o búsqueda (antes recibía en cada render un
 * `searchKeys`, `onRefresh` y `extraActions` nuevos).
 */
export const TablaTarifasSpot = React.memo(function TablaTarifasSpot({
  data,
  isLoading,
  isRefreshing,
  onRefresh,
  mostrarAutorizados,
  onAlternarAutorizados,
  onSeleccionar,
}: TablaTarifasSpotProps) {
  const columns = React.useMemo<ColumnDef<FilaTarifaSpot>[]>(
    () => [
      {
        accessorKey: "cod_tarifa_spot",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tarifa spot" />,
      },
      {
        accessorKey: "cod_cotizacion_cabecera",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cotización" />,
      },
      {
        accessorKey: "version",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Versión" />,
      },
      {
        accessorKey: "venta",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tarifa" />,
      },
      {
        accessorKey: "entidad_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      },
      {
        accessorKey: "solicitante",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Solicitante" />,
      },
      {
        accessorKey: "tipo_transporte",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Transporte" />,
      },
      {
        accessorKey: "tipo_servicio",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Servicio" />,
      },
      {
        accessorKey: "tipo_carga",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Carga" />,
      },
      {
        accessorKey: "tipo_pago",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pago" />,
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Ver tarifa Spot"
            onClick={() => onSeleccionar(row.original)}
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [onSeleccionar],
  );

  const extraActions = React.useMemo(
    () => (
      <Button type="button" size="sm" variant="outline" onClick={onAlternarAutorizados}>
        {mostrarAutorizados ? "Ocultar autorizadas" : "Mostrar autorizadas"}
      </Button>
    ),
    [mostrarAutorizados, onAlternarAutorizados],
  );

  return (
    <DataTable
      title="Autorización de tarifas Spot"
      columns={columns}
      data={data}
      searchKeys={SEARCH_KEYS}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      extraActions={extraActions}
    />
  );
});
