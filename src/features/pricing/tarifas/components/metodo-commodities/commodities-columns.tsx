import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { MetodoCommodity } from "../../api/metodo-commodities";

export type CommodityOption = {
  value: string;
  label: string;

  cod_commodity: string | number;
  nombre?: string | null;

  [key: string]: unknown;
};

export type EstadoCommodityOption = {
  value: string;
  label: string;

  cod_estado: string | number;
  estado_desc?: string | null;

  [key: string]: unknown;
};

export type FilaMetodoCommodity = Partial<MetodoCommodity> & {
  commodity?: CommodityOption | null;
  estado?: EstadoCommodityOption | null;
};

type Props = {
  onEditar: (row: FilaMetodoCommodity) => void;
  onEliminar: (row: FilaMetodoCommodity) => void;
};

export function crearCommoditiesColumns({
  onEditar,
  onEliminar,
}: Props): ColumnDef<FilaMetodoCommodity>[] {
  return [
    {
      id: "commodity",
      header: "Commodity",
      cell: ({ row }) => row.original.commodity?.label ?? "",
    },
    {
      id: "estado",
      header: "Estado",
      cell: ({ row }) => row.original.estado?.label ?? "",
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
            aria-label="Editar commodity"
            onClick={() => onEditar(row.original)}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Eliminar commodity"
            onClick={() => onEliminar(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
