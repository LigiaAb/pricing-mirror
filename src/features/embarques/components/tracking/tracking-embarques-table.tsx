import { Coordinacion, coordinacionesQueryOptions } from "@/features/coordinaciones";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { ColumnDef } from "@/shared/lib/tanstack-table";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import React, { ReactNode } from "react";
import { ESTADOS_CONFIRMADAS } from "../../lib/constantes";

const LocalTooltip = ({ value, children }: { value: string | ReactNode; children: ReactNode }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="bg-card text-card-foreground text-md border-2 border-card-foreground">{value}</TooltipContent>
    </Tooltip>
  );
};

const shortCell = ({ value, length = 10 }: { value: string; length?: number | undefined }) => {
  if (value.length <= length) return <span>{value}</span>;

  return (
    <LocalTooltip value={<span>{value}</span>}>
      <span>
        {value.slice(0, length)}
        {"..."}
      </span>
    </LocalTooltip>
  );
};

export default function TrackingEmbarquesTable({
  setSeleccionado,
  currentEmpresa = 1,
  currentCentroCosto = 16,
  reconsultar = 0,
  onOpenChange,
  selected,
  setNuevo,
}: {
  setSeleccionado: React.Dispatch<React.SetStateAction<Coordinacion | null>>;
  currentEmpresa?: number | undefined;
  currentCentroCosto?: number | undefined;
  reconsultar: number;
  onOpenChange?: (open: boolean) => void;
  selected?: Coordinacion | null;
  setNuevo?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const query = useQuery(
    coordinacionesQueryOptions({
      cod_empresa: currentEmpresa,
      cod_cc: currentCentroCosto,
      // estado_id: estado,
    }),
  );

  const refetch = React.useCallback(async () => {
    const { data } = await query.refetch();
    if (!selected) return;
    const elemento = data?.find((item) => item.coordinacion === selected.coordinacion);
    if (elemento) setSeleccionado(elemento);
  }, [query, selected]);

  React.useEffect(() => {
    refetch();
  }, [reconsultar, currentEmpresa, currentCentroCosto]);

  const lista = React.useMemo(() => (query.data ?? []).filter((i) => !!i.seg_coord_id), [query]);

  function crearColumns({
    onVer,
    // accionesDeshabilitadas,
  }: {
    onVer: (cotizacion: Coordinacion) => void;
    // accionesDeshabilitadas: boolean;
  }): (ColumnDef<Coordinacion> & { accessorKey?: keyof Coordinacion })[] {
    return [
      {
        accessorKey: "coordinacion",
        header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
        enableSorting: true,
        enableHiding: false,
      },
      // {
      //   accessorKey: "cotizacion_cabecera_id",
      //   header: ({ column }) => <DataTableColumnHeader column={column} title="Cot." />,
      //   enableSorting: true,
      //   enableHiding: false,
      // },
      {
        accessorKey: "cod_file",
        header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "cliente",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        enableSorting: true,
        enableHiding: false,
        cell: ({ row }) => shortCell({ value: row.original.cliente, length: 8 }),
      },
      {
        accessorKey: "paisOrigen",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Origen" />,
        enableSorting: true,
        enableHiding: false,
        cell: ({ row }) => shortCell({ value: row.original.paisOrigen, length: 8 }),
      },
      {
        accessorKey: "paisDestino",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Destino" />,
        enableSorting: true,
        enableHiding: false,
        cell: ({ row }) => shortCell({ value: row.original.paisDestino, length: 8 }),
      },
      {
        accessorKey: "tipoEmbarque",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Transporte" />,
        enableSorting: true,
        enableHiding: false,
      },
      // {
      //   accessorKey: "servicio",
      //   header: ({ column }) => <DataTableColumnHeader column={column} title="Servicio" />,
      //   enableSorting: true,
      //   enableHiding: false,
      //   cell: ({ row }) => shortCell({ value: row.original.servicio, length: 8 }),
      // },
      {
        accessorKey: "fechaInicio",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha de Inicio" />,
        enableSorting: true,
        enableHiding: false,
        cell: ({ row }) => {
          const value = row.original.fechaInicio as string;
          return format(new Date(value), "dd/MM/yyyy, HH:mm");
        },
      },
      // {
      //   accessorKey: "estado",
      //   header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      //   enableSorting: true,
      //   enableHiding: false,
      // },
      // {
      //   accessorKey: "entidad",
      //   header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      //   cell: ({ row }) => {
      //     const value = row.original.entidad;

      //     if (value.length <= 20) return value;

      //     return (
      //       <span title={value}>
      //         {value.slice(0, 20)}
      //         {"..."}
      //       </span>
      //     );
      //   },
      //   enableSorting: true,
      // },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const cotizacion = row.original;

          return (
            <Button type="button" size="icon" variant="ghost" aria-label={`Ver cotización ${cotizacion.coordinacion}`} onClick={() => onVer(cotizacion)}>
              <Eye className="size-4" aria-hidden="true" />
            </Button>
          );
        },
      },
    ];
  }

  const columns = React.useMemo(
    () =>
      crearColumns({
        onVer: (cotizacion) => {
          setSeleccionado(cotizacion);
          setNuevo && setNuevo(false);
          onOpenChange && onOpenChange(true);
        },
        // accionesDeshabilitadas: true,
      }),
    [],
  );

  const searchKeys = React.useMemo(() => columns.map((i) => i.accessorKey).filter((i) => i) as string[], [columns]);

  return (
    <DataTable
      data={lista}
      columns={columns}
      searchKeys={searchKeys}
      onRetry={() => {
        void refetch();
      }}
      onRefresh={() => {
        void refetch();
      }}
      extraActions={<div className="flex gap-2">{setNuevo && <Button onClick={() => setNuevo && setNuevo(true)}>Nueva</Button>}</div>}
    />
  );
}
