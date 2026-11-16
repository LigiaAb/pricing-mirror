"use client";

/**
 * Cartas viejas guardaron depto/muni/país como TEXTO (label) en vez de código;
 * cuando el catálogo carga, se resuelve el label a su código para que el
 * selector lo muestre.
 */

import { useEffect } from "react";
import type { JsonRecord, OpcionCatalogo } from "./model";

export function useResolverNombreACodigo(
  options: OpcionCatalogo[],
  actual: unknown,
  onResolve: (codigo: string) => void,
) {
  useEffect(() => {
    if (!actual || !options.length) return;
    const esCodigo = options.some((o) => String(o.value) === String(actual));
    if (esCodigo) return;
    const match = options.find((o) => o.label?.toLowerCase() === String(actual).toLowerCase());
    if (match) onResolve(String(match.value));
  }, [options, actual, onResolve]);
}

/** paisDestino nombre → código cuando el catálogo de países ya cargó. */
export function resolverPaisDestino(
  data: JsonRecord,
  paisesRaw: Array<{ cod_pais?: unknown; nombre_pais?: string }>,
): JsonRecord {
  if (!data || !paisesRaw.length) return data;
  const raw = data.paisDestino;
  if (!raw) return data;
  const esCodigo = paisesRaw.some((p) => String(p.cod_pais) === String(raw));
  if (esCodigo) return data;
  const match = paisesRaw.find((p) => p.nombre_pais?.toLowerCase() === String(raw).toLowerCase());
  return match ? { ...data, paisDestino: String(match.cod_pais) } : data;
}
