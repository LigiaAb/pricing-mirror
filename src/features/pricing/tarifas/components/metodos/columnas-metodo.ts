import type { DefCampo } from "@/features/pricing/shared";

/* ==========================================================================
 * COLUMNAS DE LA TABLA DE UN MÉTODO (rango, scalling)
 *
 * Arma las columnas a partir de la definición del método, en el orden dado:
 *
 *   ...columnasMetodo<FilaX>(METODO_X, ["costo", "cod_moneda_costo", "venta"])
 *
 *   - monto (y demás campos sin opción): { accessorKey: cod, header: label }
 *   - moneda / rubro / opcion:           { id: en, header: label, cell: opcion.label }
 *     (con `conAccessor`, también accessorFn: opcion.label, para buscar/ordenar por texto)
 *
 * Las columnas especiales (id con orden, acciones, ...) se escriben a mano.
 * Devuelve objetos de columna de TanStack (ColumnDef) con tipo propio.
 * ========================================================================== */

export type ColumnaMetodo<F> =
  | { accessorKey: string; header: string }
  | {
      id: string;
      header: string;
      cell: (contexto: { row: { original: F } }) => string;
      accessorFn?: (fila: F) => string;
    };

export function columnasMetodo<F, C extends Record<string, DefCampo> = Record<string, DefCampo>>(
  metodo: { campos: C },
  codigos: readonly (keyof C & string)[],
  { conAccessor = false }: { conAccessor?: boolean } = {},
): ColumnaMetodo<F>[] {
  return codigos.map((cod): ColumnaMetodo<F> => {
    const def = metodo.campos[cod] as DefCampo;
    const header = def.label ?? cod;

    if (def.en && def.en !== cod) {
      const en = def.en;
      const texto = (fila: F) =>
        ((fila as Record<string, unknown>)[en] as { label?: string } | null | undefined)?.label ??
        "";

      return {
        id: en,
        ...(conAccessor ? { accessorFn: texto } : {}),
        header,
        cell: ({ row }) => texto(row.original),
      };
    }

    return { accessorKey: cod, header };
  });
}
