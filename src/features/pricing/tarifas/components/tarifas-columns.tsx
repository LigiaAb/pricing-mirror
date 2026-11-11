import { format, parseISO } from "date-fns";
import { Eye, Trash } from "lucide-react";
import { DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
// import { formatearFecha } from "@/shared/lib/date";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { FilaServicioMetodo } from "../api/types-api";

type props = {
  onVerDetalle: (tarifa: FilaServicioMetodo) => void;
  mostrarVencidos?: boolean;
  setAccion: React.Dispatch<React.SetStateAction<"ingreso" | "edicion" | "lectura" | "filtro">>;
  onAnular: (row: FilaServicioMetodo) => void;
};

const LocalTooltip = ({
  value,
  children,
}: {
  value: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="bg-card text-card-foreground text-md border-2 border-card-foreground">
        {value}
      </TooltipContent>
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

export function crearTarifasColumns(
  props: props,
): (ColumnDef<FilaServicioMetodo> & { accessorKey?: string })[] {
  const {
    onVerDetalle = () => {},
    mostrarVencidos = false,
    setAccion = () => {},
    onAnular,
  } = props;
  return [
    {
      id: "acciones",
      header: "Ver",
      cell: ({ row }) => (
        <>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Ver tarifa ${row.original.cod_servicio}`}
            onClick={() => {
              onVerDetalle(row.original);
              setAccion("edicion");
            }}
          >
            <Eye aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Ver tarifa ${row.original.cod_servicio}`}
            className="text-destructive"
            onClick={() => {
              onAnular(row.original);
            }}
          >
            <Trash aria-hidden="true" />
          </Button>
        </>
      ),
    },
    {
      accessorKey: "cod_servicio",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Servicio" />,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "cod_tipo_transporte",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Transporte" />,
      cell: ({ row }) => row.original?.tipoTransporte?.nomTipo ?? "",
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "entidad_nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Carrier" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-nowrap">
          {shortCell({ value: row.original.entidad_nombre ?? "" })}
        </span>
      ),
    },
    {
      accessorKey: "nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => (
        <span className="text-nowrap">
          {shortCell({ value: `${row.original.siglas ?? ""} - ${row.original.nombre ?? ""}` })}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "rubro_nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rubro" />,
      enableSorting: true,
    },
    {
      accessorKey: "tipoServicio_nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Servicio" />,
      enableSorting: true,
    },
    {
      accessorKey: "tipoAplicacion_nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Aplicacion" />,
      enableSorting: true,
    },
    {
      accessorKey: "fechaFin",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={mostrarVencidos ? "Vencio el " : "Vencera el"}
        />
      ),
      cell: ({ row }) =>
        row.original.fecha_final
          ? format(
              parseISO(row.original.fecha_final.toISOString().split("T")[0] ?? ""),
              "dd/MM/yyyy",
            )
          : "No definido",
      enableSorting: true,
    },
  ];
}
