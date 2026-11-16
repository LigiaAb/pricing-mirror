import { Eye } from "lucide-react";
import type { Coordinacion } from "@/features/coordinaciones";
import { Badge } from "@/shared/components/ui/badge";
import { formatearFechaHora } from "@/shared/lib/date";
import type { ColumnDef } from "@/shared/lib/tanstack-table";

function MonoCell({ getValue }: { readonly getValue: () => unknown }) {
  return <span className="font-mono text-sm font-medium">{String(getValue() ?? "")}</span>;
}

function TruncatedCell({ getValue }: { readonly getValue: () => unknown }) {
  return <span className="max-w-45 truncate block">{String(getValue() ?? "")}</span>;
}

export function accionesColumn(handleView: (row: Coordinacion) => void): ColumnDef<Coordinacion> {
  return {
    id: "acciones",
    header: "",
    cell: ({ row }) => (
      <button
        type="button"
        aria-label="Ver"
        title="Ver"
        className="inline-flex size-8 items-center justify-center rounded hover:bg-muted/50"
        onClick={(e) => {
          e.stopPropagation();
          handleView(row.original);
        }}
      >
        <Eye className="size-4" />
      </button>
    ),
    size: 48,
    enableSorting: false,
  };
}

/**
 * Columnas comunes a las listas de CTS y gestión de embarques. Cada lista
 * compone su set visible con el mismo orden que la tabla del legacy.
 */
export const columnasCoordinacion = {
  id: {
    accessorKey: "embarqueId",
    header: "ID",
    cell: MonoCell,
  },
  cotizacionCabecera: {
    accessorKey: "cotizacionCabeceraId",
    header: "Cotización",
    cell: MonoCell,
  },
  file: {
    accessorKey: "cod_file",
    header: "File",
    cell: MonoCell,
  },
  empresa: {
    accessorKey: "empresa",
    header: "Empresa",
  },
  centroCosto: {
    accessorKey: "centroCosto",
    header: "Centro de Costo",
  },
  cliente: {
    accessorKey: "cliente",
    header: "Cliente",
    cell: TruncatedCell,
  },
  origen: {
    accessorKey: "paisOrigen",
    header: "Origen",
  },
  destino: {
    accessorKey: "paisDestino",
    header: "Destino",
  },
  tipoEmbarque: {
    accessorKey: "tipoEmbarque",
    header: "Tipo Embarque",
  },
  servicio: {
    accessorKey: "servicio",
    header: "Servicio",
  },
  estado: {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ getValue }) => <Badge variant="outline">{String(getValue() ?? "")}</Badge>,
  },
  fechaInicio: {
    accessorKey: "fechaInicio",
    header: "Fecha Inicio",
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap">
        {formatearFechaHora(getValue() as string | null | undefined)}
      </span>
    ),
  },
  responsable: {
    accessorKey: "responsable",
    header: "Responsable",
  },
} satisfies Record<string, ColumnDef<Coordinacion>>;
