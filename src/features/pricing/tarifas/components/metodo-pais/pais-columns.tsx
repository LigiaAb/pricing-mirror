import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { TarifaRuta } from "../../api/tarifa-rutas";

export type RutaOption = {
  value: string | number;
  label: string;

  cod_continente?: string | number | null;
  cod_pais?: string | number | null;
  cod_tipo?: string | number | null;
  cod_puntoenlace?: string | number | null;
  cod_ciudad?: string | number | null;

  [key: string]: unknown;
};

export type FilaMetodoPais = TarifaRuta & {
  tipo?: RutaOption | null;
  continente?: RutaOption | null;
  pais?: RutaOption | null;
  tipo_puntoenlace?: RutaOption | null;
  punto_enlace?: RutaOption | null;
  ciudad?: RutaOption | null;
};

type Props = {
  esTerrestre: boolean;
  onEditar: (row: FilaMetodoPais) => void;
  onEliminar: (row: FilaMetodoPais) => void;
};

export function crearPaisColumns({
  esTerrestre,
  onEditar,
  onEliminar,
}: Props): ColumnDef<FilaMetodoPais>[] {
  const columns: ColumnDef<FilaMetodoPais>[] = [
    {
      accessorKey: "tipo_desc",
      header: "Tipo de Ruta",
    },
    {
      accessorKey: "nombre_continente",
      header: "Continente",
    },
    {
      accessorKey: "nombre_pais",
      header: "País",
    },
  ];

  if (esTerrestre) {
    columns.push({
      accessorKey: "ciudad",
      header: "Ciudad",
      cell: ({ row }) => row.original.ciudad?.label ?? "",
    });
  } else {
    columns.push(
      {
        accessorKey: "tipo_puntoenlace_desc",
        header: "Tipo",
      },
      {
        accessorKey: "nombre",
        header: "Aduana/Puerto/Aeropuerto",
      },
    );
  }

  columns.push({
    accessorKey: "acciones",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Editar ruta"
          onClick={() => onEditar(row.original)}
        >
          <Pencil className="size-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Eliminar ruta"
          onClick={() => onEliminar(row.original)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    ),
  });

  return columns;
}
