/* ==========================================================================
 * RANGOS DE TARIFA — LECTURA (compartida por Tarifas y Cotizaciones)
 *
 * Las mutaciones viven en tarifas/api/tarifa-rangos.ts.
 * ========================================================================== */

import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

export const TARIFA_RANGOS_QUERY_KEY = ["tarifas", "rangos"] as const;

export const tarifaRangoSchema = z
  .object({
    cod_tarifa_rango: zId,
    cod_metodo: zId.nullable(),

    inicio: z.union([z.string(), z.number()]).nullable(),
    final: z.union([z.string(), z.number()]).nullable(),

    costo_minimo: z.union([z.string(), z.number()]).nullable(),
    venta_minimo: z.union([z.string(), z.number()]).nullable(),

    costo: z.union([z.string(), z.number()]).nullable(),
    cod_moneda_costo: zId.nullable(),

    venta: z.union([z.string(), z.number()]).nullable(),
    cod_moneda_venta: zId.nullable(),

    cod_estado: zId,
  })
  .passthrough();

export type TarifaRango = z.infer<typeof tarifaRangoSchema>;

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
