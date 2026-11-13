import { Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { type FilaRango, METODO_RANGO } from "@/features/pricing/shared";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { MonedaOpcion } from "../../../hooks/use-opciones-tarifa";
import { columnasMetodo } from "../columnas-metodo";

export type MonedaRangoOption = MonedaOpcion;

/** Fila de la tabla: la fila del método (pricing/shared/lib/metodos/rango.ts) + id local. */
export type FilaMetodoRango = FilaRango & {
  localId: string;
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
    // Encabezados = `label` de cada campo en la definición.
    ...columnasMetodo<FilaMetodoRango>(METODO_RANGO, [
      "costo_minimo",
      "venta_minimo",
      "costo",
      "cod_moneda_costo",
      "venta",
      "cod_moneda_venta",
    ]),
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
