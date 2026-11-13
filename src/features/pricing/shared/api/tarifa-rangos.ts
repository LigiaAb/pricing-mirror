/* ==========================================================================
 * RANGOS DE TARIFA — LECTURA (compartida por Tarifas y Cotizaciones)
 *
 * Las mutaciones viven en tarifas/api/tarifa-rangos.ts.
 * ========================================================================== */

import { queryOptions, useQuery } from "@tanstack/react-query";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { METODO_RANGO, type TarifaRango } from "../lib/metodos/rango";

export const TARIFA_RANGOS_QUERY_KEY = ["tarifas", "rangos"] as const;

// Campos, tipos y payload: definición única en ../lib/metodos/rango.ts.
export const tarifaRangoSchema = METODO_RANGO.esquema;

export type { TarifaRango };

export interface FiltrosTarifaRango {
  codEstado?: string | number;
  codMetodo?: string | number;
}

export const tarifaRangosOptions = (filtros: FiltrosTarifaRango = {}) =>
  queryOptions({
    ...CACHE_DYNAMIC,

    queryKey: [...TARIFA_RANGOS_QUERY_KEY, filtros],

    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-tarifa-rango", {
          params: {
            cod_estado: filtros.codEstado,
            cod_metodo: filtros.codMetodo,
          },
        }),
        tarifaRangoSchema,
        "lista-tarifa-rango",
      ),

    enabled: filtros.codMetodo != null,
  });

export function useTarifaRangos(filtros: FiltrosTarifaRango = {}) {
  return useQuery(tarifaRangosOptions(filtros));
}
