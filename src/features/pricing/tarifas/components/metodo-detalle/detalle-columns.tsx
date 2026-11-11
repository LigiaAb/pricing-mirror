import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { TarifaDetalle } from "../../api/tarifa-detalles";

export type DetalleTipoOption = {
  value: string;
  label: string;
  cod_tipo?: string | number | null;
  cod_tipo_dato?: string | number | null;
  [key: string]: unknown;
};

export type FilaMetodoDetalle = Partial<TarifaDetalle> & {
  tipo?: DetalleTipoOption | null;
};

type CrearDetalleColumnsProps = {
  onEditar: (row: FilaMetodoDetalle) => void;
  onEliminar: (row: FilaMetodoDetalle) => void;
};

export function crearDetalleColumns({
  onEditar,
  onEliminar,
}: CrearDetalleColumnsProps): ColumnDef<FilaMetodoDetalle>[] {
  return [
    {
      id: "tipo",
      header: "Tipo de Detalle",
      cell: ({ row }) => row.original.tipo?.label ?? "",
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => row.original.descripcion ?? "",
    },
    {
      accessorKey: "valor",
      header: "Valor",
      cell: ({ row }) => row.original.valor ?? "",
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Editar detalle"
            onClick={() => onEditar(row.original)}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Eliminar detalle"
            onClick={() => onEliminar(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
