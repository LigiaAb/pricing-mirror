import { Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { TarifaRango } from "../../../api/tarifa-rangos";

export type MonedaRangoOption = {
  value: string;
  label: string;

  cod_moneda: string | number;
  simbolo_moneda?: string;

  [key: string]: unknown;
};

export type FilaMetodoRango = Partial<TarifaRango> & {
  localId: string;

  moneda_costo?: MonedaRangoOption | null;
  moneda_venta?: MonedaRangoOption | null;
};

type Props = {
  readonly?: boolean;
  onEditar: (row: FilaMetodoRango) => void;
  onEliminar: (row: FilaMetodoRango) => void;
};

export function crearRangoColumns({
  readonly = false,
  onEditar,
  onEliminar,
}: Props): ColumnDef<FilaMetodoRango>[] {
  const columns: ColumnDef<FilaMetodoRango>[] = [
    {
      accessorKey: "cod_tarifa_rango",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Id interno" />,
    },
    {
      accessorKey: "inicio",
      header: ({ column }) => <DataTableColumnHeader column={column} title="A partir de..." />,
      enableSorting: true,
    },
    {
      accessorKey: "costo_minimo",
      header: "Mínimo costo",
    },
    {
      accessorKey: "venta_minimo",
      header: "Mínimo venta",
    },
    {
      accessorKey: "costo",
      header: "Costo",
    },
    {
      id: "moneda_costo",
      header: "Moneda costo",
      cell: ({ row }) => row.original.moneda_costo?.label ?? "",
    },
    {
      accessorKey: "venta",
      header: "Venta",
    },
    {
      id: "moneda_venta",
      header: "Moneda venta",
      cell: ({ row }) => row.original.moneda_venta?.label ?? "",
    },
  ];

  if (!readonly) {
    columns.push({
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={() => onEditar(row.original)}>
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onEliminar(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    });
  }

  return columns;
}
