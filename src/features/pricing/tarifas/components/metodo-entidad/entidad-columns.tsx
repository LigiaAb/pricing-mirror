import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { TarifaEntidad } from "../../api/tarifa-entidades";

export type FilaMetodoEntidad = TarifaEntidad & {
  entidad_nombre?: string | null;
};

type Props = {
  onEliminar: (row: FilaMetodoEntidad) => void;
};

export function crearEntidadColumns({ onEliminar }: Props): ColumnDef<FilaMetodoEntidad>[] {
  return [
    // {
    //   accessorKey: "entidad_id",
    //   header: "Código",
    // },
    {
      accessorKey: "nombre_cliente",
      header: "Entidad",
    },
    // {
    //   accessorKey: "json",
    //   header: "Entidad",
    //   cell: ({ row }) => JSON.stringify(row.original, null, 2),
    // },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Eliminar entidad"
          onClick={() => onEliminar(row.original)}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];
}
