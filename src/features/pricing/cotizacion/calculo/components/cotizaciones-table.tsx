"use client";

import { format } from "date-fns";
import { Eye, Plus, ShieldCheck, Trash, Trash2 } from "lucide-react";
import * as React from "react";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { CotizacionCabecera } from "../api/cotizacion-cabecera";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import type { Id } from "../lib/tipos";
import { mismoId } from "../lib/utils";
import { shortCell } from "./utils";

export type OpcionCatalogoCotizacion = {
  value: Id;
  label: string;
  [key: string]: unknown;
};

export type CatalogosTablaCotizaciones = {
  clientes?: OpcionCatalogoCotizacion[];
  tiposTransporte?: OpcionCatalogoCotizacion[];
  tiposServicio?: OpcionCatalogoCotizacion[];
  tiposCarga?: OpcionCatalogoCotizacion[];
  tiposPago?: OpcionCatalogoCotizacion[];
  clasificacionesCarga?: OpcionCatalogoCotizacion[];
};

type CotizacionTabla = CotizacionCabecera & {
  entidad: string;
  tipoTransporte: string;
  tipoServicio: string;
  tipoCarga: string;
  tipoPago: string;
  clasificacionCarga: string;
};

export type CotizacionesTableProps = {
  cotizacionesVisibles: CotizacionCabecera[];
  mostrarConfirmados: boolean;
  mostrarVencidas: boolean;
  alternarConfirmados: () => void;
  alternarVencidas: () => void;
  seleccionarCotizacion: (cotizacion: CotizacionCabecera) => void;
  nuevaCotizacion: () => void;
  limpiarCotizacion: () => void;
  rechazarCotizacion: (codCotizacionCabecera: Id) => Promise<boolean>;
  confirmarCotizacion: (codCotizacionCabecera: Id) => Promise<boolean>;
  puedeConfirmarCotizacion: (cotizacion: CotizacionCabecera) => boolean;
  refetchCotizaciones: () => unknown;
  isLoading: boolean;
  isFetching: boolean;
  isRejecting: boolean;
  isValidatingEligibility: boolean;
  isConfirming: boolean;
  error: unknown;
  filtro: React.ReactNode;
};

function obtenerLabel(catalogo: OpcionCatalogoCotizacion[] | undefined, value: unknown) {
  if (value == null) return "";

  return catalogo?.find((item) => mismoId(item.value, value))?.label ?? "";
}

function obtenerCliente(
  cotizacion: CotizacionCabecera,
  clientes: OpcionCatalogoCotizacion[] | undefined,
) {
  if (typeof cotizacion.entidad_nombre === "string" && cotizacion.entidad_nombre.trim() !== "") {
    return cotizacion.entidad_nombre;
  }

  return obtenerLabel(clientes, cotizacion.entidad_id);
}

function crearCotizacionesColumns({
  onVer,
  onConfirmar,
  onRechazar,
  puedeConfirmar,
  accionesDeshabilitadas,
}: {
  onVer: (cotizacion: CotizacionCabecera) => void;
  onConfirmar: (cotizacion: CotizacionCabecera) => void;
  onRechazar: (cotizacion: CotizacionCabecera) => void;
  puedeConfirmar: (cotizacion: CotizacionCabecera) => boolean;
  accionesDeshabilitadas: boolean;
}): ColumnDef<CotizacionTabla>[] {
  return [
    {
      accessorKey: "fecha_creacion",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
      enableSorting: true,
      enableHiding: false,
      cell: ({ getValue }) => (
        <span className="text-nowrap">{format(new Date(getValue() as string), "dd-MM-yyyy")}</span>
      ),
    },
    {
      accessorKey: "fecha_vencimiento",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vence el" />,
      enableSorting: true,
      enableHiding: false,
      cell: ({ getValue }) => (
        <span className="text-nowrap">
          {getValue() ? format(new Date(getValue() as string), "dd-MM-yyyy") : ""}
        </span>
      ),
    },
    {
      accessorKey: "cod_cotizacion_cabecera",
      header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "entidad",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      cell: ({ row }) => (
        <span className="text-nowrap">{shortCell({ value: row.original.entidad, length: 8 })}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "tipoTransporte",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Transporte" />,
      enableSorting: true,
    },
    {
      accessorKey: "tipoServicio",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Servicio" />,
      enableSorting: true,
    },
    {
      accessorKey: "destino",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Destino" />,
      enableSorting: true,
    },
    {
      accessorKey: "usuario",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
      enableSorting: true,
    },
    {
      accessorKey: "tipoPago",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de pago" />,
      enableSorting: true,
      cell: ({ row }) =>
        row.original.tipoPago === "PREPAID / COLLECT"
          ? "P / C"
          : row.original.tipoPago === "PREPAID"
            ? "P"
            : row.original.tipoPago === "COLLECT"
              ? "C"
              : row.original.tipoPago,
    },
    {
      accessorKey: "tipoCarga",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Carga" />,
      enableSorting: true,
    },
    {
      accessorKey: "peso",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Peso" />,
      enableSorting: true,
    },
    {
      accessorKey: "volumen",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Volumen" />,
      enableSorting: true,
    },
    {
      accessorKey: "estado_nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      enableSorting: true,
    },
    // {
    //   accessorKey: "clasificacionCarga",
    //   header: ({ column }) => <DataTableColumnHeader column={column} title="Clasificación de Carga" />,
    //   enableSorting: true,
    // },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const cotizacion = row.original;
        const confirmarHabilitado = puedeConfirmar(cotizacion);

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Ver cotización ${cotizacion.cod_cotizacion_cabecera}`}
              onClick={() => onVer(cotizacion)}
            >
              <Eye className="size-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Confirmar cotización ${cotizacion.cod_cotizacion_cabecera}`}
              disabled={!confirmarHabilitado || accionesDeshabilitadas}
              onClick={() => onConfirmar(cotizacion)}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              aria-label={`Rechazar cotización ${cotizacion.cod_cotizacion_cabecera}`}
              disabled={accionesDeshabilitadas}
              onClick={() => onRechazar(cotizacion)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export function CotizacionesTable({
  cotizacionesVisibles,
  mostrarConfirmados,
  mostrarVencidas,
  alternarConfirmados,
  alternarVencidas,
  seleccionarCotizacion,
  nuevaCotizacion,
  limpiarCotizacion,
  rechazarCotizacion,
  confirmarCotizacion,
  puedeConfirmarCotizacion,
  refetchCotizaciones,
  isLoading,
  isFetching,
  isRejecting,
  isValidatingEligibility,
  isConfirming,
  error,
  filtro,
}: CotizacionesTableProps) {
  const { formulario: catalogos } = useCatalogosCotizacion();

  const data = React.useMemo<CotizacionTabla[]>(
    () =>
      cotizacionesVisibles
        .map((cotizacion) => ({
          ...cotizacion,
          entidad: obtenerCliente(cotizacion, catalogos.clientes),
          tipoTransporte: obtenerLabel(catalogos.tiposTransporte, cotizacion.cod_tipo_transporte),
          tipoServicio: obtenerLabel(catalogos.tiposServicio, cotizacion.cod_tipo_servicio),
          tipoCarga: obtenerLabel(catalogos.tiposCarga, cotizacion.cod_tipo_carga),
          tipoPago: obtenerLabel(catalogos.tiposPago, cotizacion.cod_tipo_pago),
          clasificacionCarga: obtenerLabel(
            catalogos.clasificacionesCarga,
            cotizacion.cod_clasificacion_carga,
          ),
        }))
        .sort((a, b) => Number(a.cod_cotizacion_cabecera) - Number(b.cod_cotizacion_cabecera)),
    [
      cotizacionesVisibles,
      catalogos.clientes,
      catalogos.tiposTransporte,
      catalogos.tiposServicio,
      catalogos.tiposCarga,
      catalogos.tiposPago,
      catalogos.clasificacionesCarga,
    ],
  );

  const accionesDeshabilitadas = isRejecting || isValidatingEligibility || isConfirming;

  const handleConfirmar = React.useCallback(
    (cotizacion: CotizacionCabecera) => {
      void confirmarCotizacion(cotizacion.cod_cotizacion_cabecera);
    },
    [confirmarCotizacion],
  );

  const handleRechazar = React.useCallback(
    (cotizacion: CotizacionCabecera) => {
      void rechazarCotizacion(cotizacion.cod_cotizacion_cabecera);
    },
    [rechazarCotizacion],
  );

  const columns = React.useMemo(
    () =>
      crearCotizacionesColumns({
        onVer: seleccionarCotizacion,
        onConfirmar: handleConfirmar,
        onRechazar: handleRechazar,
        puedeConfirmar: puedeConfirmarCotizacion,
        accionesDeshabilitadas,
      }),
    [
      seleccionarCotizacion,
      handleConfirmar,
      handleRechazar,
      puedeConfirmarCotizacion,
      accionesDeshabilitadas,
    ],
  );

  return (
    <DataTable
      title="Cotizaciones"
      columns={columns}
      data={data}
      searchKeys={columns.flatMap((column) =>
        "accessorKey" in column && typeof column.accessorKey === "string"
          ? [column.accessorKey]
          : [],
      )}
      searchPlaceholder="Buscar cotización…"
      onRefresh={() => {
        void refetchCotizaciones();
      }}
      isRefreshing={isFetching}
      isLoading={isLoading}
      hasError={error != null}
      errorMessage={
        error instanceof Error ? error.message : "No fue posible cargar las cotizaciones."
      }
      onRetry={() => {
        void refetchCotizaciones();
      }}
      emptyTitle="No hay cotizaciones"
      emptyMessage={
        mostrarConfirmados
          ? "No se encontraron cotizaciones confirmadas."
          : "No se encontraron cotizaciones pendientes."
      }
      extraActions={
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-destructive hover:text-destructive"
            onClick={limpiarCotizacion}
          >
            <Trash className="size-4" aria-hidden="true" />
            Limpiar Selección
          </Button>

          {!mostrarConfirmados && (
            <Button type="button" size="sm" variant="outline" onClick={alternarVencidas}>
              {mostrarVencidas ? "Ocultar Vencidas" : "Mostrar Vencidas"}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (mostrarVencidas) {
                alternarVencidas();
              }
              alternarConfirmados();
            }}
          >
            {mostrarConfirmados ? "Ocultar confirmados" : "Mostrar confirmados"}
          </Button>

          {filtro}

          <Button type="button" size="sm" onClick={nuevaCotizacion}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo
          </Button>
        </>
      }
    />
  );
}
