"use client";

import { X } from "lucide-react";
import type * as React from "react";
import { Button } from "@/shared/components/ui/button";

interface DataTableSelectionBarProps {
  /** Filas seleccionadas dentro del conjunto filtrado. */
  seleccionadas: number;
  /** Total de filas que pasan el filtro actual. */
  totalFiltrado: number;
  /** Acciones masivas del dominio (exportar, cambiar estado, …). */
  acciones?: React.ReactNode;
  /** Selecciona todos los resultados filtrados, no solo la página visible. */
  onSeleccionarTodos?: () => void;
  onLimpiar: () => void;
}

/**
 * Barra contextual que acompaña la toolbar mientras hay selección.
 *
 * La toolbar permanece disponible para que búsqueda, filtros, columnas y
 * acciones de la vista no queden inaccesibles al marcar filas.
 */
export function DataTableSelectionBar({
  seleccionadas,
  totalFiltrado,
  acciones,
  onSeleccionarTodos,
  onLimpiar,
}: Readonly<DataTableSelectionBarProps>) {
  const puedeAmpliarSeleccion =
    Boolean(onSeleccionarTodos) && totalFiltrado > seleccionadas && seleccionadas > 0;

  return (
    <div
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-primary px-4 py-2 text-primary-foreground"
    >
      <span className="tabular text-[14px] font-semibold">
        {seleccionadas} {seleccionadas === 1 ? "fila seleccionada" : "filas seleccionadas"}
      </span>

      {puedeAmpliarSeleccion && (
        <button
          type="button"
          onClick={onSeleccionarTodos}
          className="rounded-sm text-[14px] font-medium text-primary-foreground/80 underline underline-offset-2 transition-colors hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
        >
          Seleccionar los {totalFiltrado} resultados
        </button>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-1">
        {acciones}

        {acciones && <div aria-hidden="true" className="mx-1 h-4 w-px bg-primary-foreground/25" />}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
          onClick={onLimpiar}
          aria-label="Limpiar selección"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
