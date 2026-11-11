import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { TarifaScalling } from "../../../api/tarifa-scalling";
import type { MonedaOpcion } from "../../../hooks/use-opciones-tarifa";

export type TipoPuntoEnlaceScallingOption = {
  value: string;
  label: string;

  cod_tipo: string | number;

  [key: string]: unknown;
};

export type PuntoEnlaceScallingOption = {
  value: string;
  label: string;

  cod_puntoenlace: string | number;
  cod_tipo: string | number;

  [key: string]: unknown;
};

export type MonedaScallingOption = MonedaOpcion;

export type FilaMetodoScalling = Partial<TarifaScalling> & {
  tipo_puntoenlace?: TipoPuntoEnlaceScallingOption | null;
  punto_enlace?: PuntoEnlaceScallingOption | null;
  moneda?: MonedaScallingOption | null;
};

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

    {
      id: "punto_enlace",

      accessorFn: (row) => row.punto_enlace?.label ?? "",

      header: "Aduana/Puerto/Aeropuerto",

      cell: ({ row }) => row.original.punto_enlace?.label ?? "",
    },

    {
      id: "moneda",

      accessorFn: (row) => row.moneda?.label ?? "",

      header: "Moneda",

      cell: ({ row }) => row.original.moneda?.label ?? "",
    },

    {
      accessorKey: "costo",
      header: "Valor",
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
