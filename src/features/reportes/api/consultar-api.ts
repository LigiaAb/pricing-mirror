import type { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ParamsReporte } from "../lib/definir-reporte";

export interface OpcionesConsultarApi {
  /**
   * Propiedad de `data` que trae la lista, cuando no viene en `data.data` ni como lista directa
   * (ej. `report_kpi_cotizaciones` responde `{ data: { reporte, filas: [...] } }` → `"filas"`).
   */
  lista?: string;
  /** Parámetros fijos que se suman a los de la pantalla (ej. `{ reporte: "hit_rate" }`). */
  params?: Record<string, string>;
}

/**
 * Atajo para `consultar` de un reporte: GET al endpoint con los parámetros por query
 * string (fechas, empresa, CC y filtros, con sus mismos nombres) y validación zod de cada fila.
 * Si el backend responde `success: false`, lanza su mensaje (se ve en la sección "Reporte").
 *
 *   consultar: consultarApi("/api/appweb/report-icc", filaSchema)
 *   consultar: consultarApi("/api/appweb/report_kpi_cotizaciones", filaSchema, {
 *     lista: "filas",
 *     params: { reporte: "hit_rate" },
 *   })
 */
export function consultarApi<TSchema extends z.ZodType>(
  endpoint: string,
  schema: TSchema,
  opciones: OpcionesConsultarApi = {},
) {
  return async (params: ParamsReporte): Promise<z.output<TSchema>[]> =>
    parseEnvelope(
      await http.get<unknown>(endpoint, { params: { ...params, ...opciones.params } }),
      schema,
      endpoint,
      opciones.lista ? { listKey: opciones.lista } : undefined,
    );
}
