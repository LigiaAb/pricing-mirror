import type { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ParamsReporte } from "../lib/definir-reporte";

/**
 * Atajo para `consultar` de un reporte: GET al endpoint con los parámetros por query
 * string y validación zod de cada fila.
 *
 *   consultar: consultarApi("/api/appweb/report-icc", filaSchema)
 */
export function consultarApi<TSchema extends z.ZodType>(endpoint: string, schema: TSchema) {
  return async (params: ParamsReporte): Promise<z.output<TSchema>[]> =>
    parseEnvelope(await http.get<unknown>(endpoint, { params }), schema, endpoint);
}
