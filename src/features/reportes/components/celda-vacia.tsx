import type * as React from "react";
import { type ValorCelda, valorVacio } from "../lib/definir-reporte";

/**
 * Celda de la tabla del reporte con el dato, o resaltada en amarillo si está vacía (como en el
 * Excel con `colorFondoCelda`). Para `celda` de una columna:
 *
 *   { id: "booking", label: "Booking", valor: (f) => f.booking, celda: celdaResaltandoVacia }
 */
export function celdaResaltandoVacia(valor: ValorCelda): React.ReactNode {
  if (!valorVacio(valor)) return valor;
  return (
    <span className="-mx-2 block rounded bg-yellow-200 px-2 text-center text-muted-foreground">
      —
    </span>
  );
}
