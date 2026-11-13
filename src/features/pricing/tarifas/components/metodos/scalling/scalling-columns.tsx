import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { type FilaMetodoScalling, METODO_SCALLING } from "../../../lib/metodos/scalling";
import { columnasMetodo } from "../columnas-metodo";

// Tipos: definición única en lib/metodos/scalling.ts (se reexportan con sus nombres de siempre).
export type {
  FilaMetodoScalling,
  MonedaScallingOption,
  PuntoEnlaceScallingOption,
  TipoPuntoEnlaceScallingOption,
} from "../../../lib/metodos/scalling";

type Props = {
  onEditar: (row: FilaMetodoScalling) => void;
  onEliminar: (row: FilaMetodoScalling) => void;
};

export function crearScallingColumns({
  onEditar,
  onEliminar,
}: Props): ColumnDef<FilaMetodoScalling>[] {
  return [
    {
      id: "tipo_puntoenlace",

      accessorFn: (row) => row.tipo_puntoenlace?.label ?? "",

      header: "Tipo",

      cell: ({ row }) => row.original.tipo_puntoenlace?.label ?? "",
    },

    // Encabezados = `label` de cada campo; accessorFn para la búsqueda por texto.
    ...columnasMetodo<FilaMetodoScalling>(
      METODO_SCALLING,
      ["cod_puntoenlace", "cod_moneda", "costo"],
      { conAccessor: true },
    ),

    {
      id: "acciones",
      header: "",

      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Editar scalling"
            onClick={() => onEditar(row.original)}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Eliminar scalling"
            onClick={() => onEliminar(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
