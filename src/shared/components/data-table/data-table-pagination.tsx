"use client";
"use no memo";

import type { RowData } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { ReactDataTable } from "@/shared/lib/tanstack-table";
import { cn } from "@/shared/lib/utils";

const TAMANOS_PAGINA = [5, 10, 20, 30, 50, 100];
/** A partir de aquí la lista de páginas se recorta con elipsis. */
const PAGINAS_SIN_RECORTE = 7;

type ItemPaginacion =
  | { tipo: "pagina"; indice: number }
  | { tipo: "elipsis"; lado: "inicio" | "fin" };

/**
 * Ventana de páginas: primera, última, la actual y sus vecinas. El resto se
 * colapsa en elipsis para que la barra no crezca con el número de páginas.
 */
export function ventanaPaginas(pageIndex: number, pageCount: number): ItemPaginacion[] {
  if (pageCount <= PAGINAS_SIN_RECORTE) {
    return Array.from({ length: pageCount }, (_, indice) => ({ tipo: "pagina", indice }));
  }

  const indices = new Set<number>([0, pageCount - 1, pageIndex]);
  if (pageIndex - 1 > 0) indices.add(pageIndex - 1);
  if (pageIndex + 1 < pageCount - 1) indices.add(pageIndex + 1);
  // Con la actual pegada a un extremo, se estira hacia el centro para no dejar
  // una barra más corta en las primeras y últimas páginas.
  if (pageIndex <= 1) indices.add(2);
  if (pageIndex >= pageCount - 2) indices.add(pageCount - 3);

  const ordenados = [...indices]
    .filter((indice) => indice >= 0 && indice < pageCount)
    .sort((a, b) => a - b);

  const items: ItemPaginacion[] = [];
  for (const [posicion, indice] of ordenados.entries()) {
    const anterior = ordenados[posicion - 1];
    if (anterior !== undefined && indice - anterior > 1) {
      items.push({ tipo: "elipsis", lado: anterior < pageIndex ? "inicio" : "fin" });
    }
    items.push({ tipo: "pagina", indice });
  }

  return items;
}

export function DataTablePagination<TData extends RowData>({
  table,
  rowCount,
}: Readonly<{ table: ReactDataTable<TData>; rowCount?: number | undefined }>) {
  const pageCount = Math.max(table.getPageCount(), 1);
  const { pageIndex, pageSize } = table.state.pagination;
  const totalCount = rowCount ?? table.getFilteredRowModel().rows.length;
  const visibleCount = table.getRowModel().rows.length;
  const desde = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const hasta = pageIndex * pageSize + visibleCount;

  return (
    <div className="flex flex-col gap-3 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="order-2 text-[14px] text-muted-foreground sm:order-1">
        <span className="tabular font-medium text-foreground">
          {desde}–{hasta}
        </span>{" "}
        de <span className="tabular font-medium text-foreground">{totalCount}</span>{" "}
        {totalCount === 1 ? "registro" : "registros"}
      </p>

      <div className="order-1 flex items-center justify-between gap-3 sm:order-2 sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="hidden text-[14px] text-muted-foreground md:inline">Filas</span>
          <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger
              aria-label="Filas por página"
              className="tabular h-7.5 w-16 border-border bg-card text-[14px]"
            >
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {TAMANOS_PAGINA.map((tamano) => (
                <SelectItem key={tamano} value={`${tamano}`}>
                  {tamano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav aria-label="Paginación" className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7.5 w-7.5 text-muted-foreground hover:text-foreground"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Ir a página anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>

          {ventanaPaginas(pageIndex, pageCount).map((item) =>
            item.tipo === "elipsis" ? (
              <span
                key={`elipsis-${item.lado}`}
                aria-hidden="true"
                className="flex h-7.5 w-6 items-center justify-center text-[14px] text-muted-foreground/70"
              >
                …
              </span>
            ) : (
              <Button
                key={item.indice}
                type="button"
                variant="ghost"
                className={cn(
                  "tabular h-7.5 min-w-7.5 px-1.5 text-[14px] font-medium text-muted-foreground hover:text-foreground",
                  // Teal, no azul de marca: la cabecera ya es azul entero, así
                  // que lo accionable del pie necesita el otro acento.
                  item.indice === pageIndex &&
                    "bg-teal font-semibold text-teal-foreground hover:bg-teal/90 hover:text-teal-foreground",
                )}
                onClick={() => table.setPageIndex(item.indice)}
                aria-label={`Ir a página ${item.indice + 1}`}
                aria-current={item.indice === pageIndex ? "page" : undefined}
              >
                {item.indice + 1}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7.5 w-7.5 text-muted-foreground hover:text-foreground"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Ir a página siguiente"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  );
}
