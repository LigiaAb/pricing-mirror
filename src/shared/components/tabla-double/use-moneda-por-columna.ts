"use client";

import { useMemo } from "react";

type Doc = Record<string, unknown>;

/**
 * Construye un mapa { [valorDeColumna]: moneda }.
 * Solo asigna moneda si TODOS los documentos de esa columna tienen
 * la misma moneda. Si hay mezcla (ej: 2024 tiene GTQ y USD), el key
 * queda sin moneda → no se muestra prefijo.
 *
 * @param documentos - array de docs planos
 * @param campoColumna - campo que define las columnas (ej: 'FILE_ANIO', 'DOC_TIPO_NOMBRE')
 * @param campoMoneda - campo con la moneda (por defecto 'DOC_MONEDA')
 */
export function useMonedaPorColumna(
  documentos: Doc[],
  campoColumna: string,
  campoMoneda = "DOC_MONEDA",
): Record<string, string> {
  return useMemo(() => {
    const mapa: Record<string, Set<string>> = {};

    documentos.forEach((doc) => {
      const colKey = String(doc[campoColumna] ?? "");
      const moneda = doc[campoMoneda] as string | undefined;
      if (!colKey || !moneda) return;

      if (!mapa[colKey]) mapa[colKey] = new Set();
      mapa[colKey].add(moneda);
    });

    // Si una columna solo tiene UNA moneda → la asignamos.
    // Si tiene varias → se omite (sin prefijo).
    const resultado: Record<string, string> = {};
    Object.entries(mapa).forEach(([colKey, monedas]) => {
      if (monedas.size === 1) {
        const only = Array.from(monedas)[0];
        if (only) resultado[colKey] = only;
      }
    });

    return resultado;
  }, [documentos, campoColumna, campoMoneda]);
}
