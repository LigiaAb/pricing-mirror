import type { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ParamsReporte } from "../lib/definir-reporte";

export interface OpcionesConsultarApi {
  /**
   * Propiedad de `data` que trae la lista, cuando no viene en `data.data` ni como lista directa
   * (ej. el endpoint responde `{ data: { tipo, detalle: [...] } }` → `"detalle"`).
   */
  lista?: string;
  /** Parámetros fijos que se suman a los de la pantalla (ej. `{ tipo: "mensual" }`). */
  params?: Record<string, string>;
  /**
   * Otros nombres para los parámetros de la pantalla, cuando el endpoint los espera distinto
   * (ej. `{ cod_empresa: "cod_emp", fecha_inicio: "fecha_inicial" }`). Los que no estén aquí
   * van con su nombre de siempre.
   */
  nombres?: Record<string, string>;
}

/**
 * Atajo para `consultar` de un reporte: GET al endpoint con los parámetros por query
 * string (fechas, empresa, CC y filtros, con sus mismos nombres) y validación zod de cada fila.
 * Si el backend responde `success: false`, lanza su mensaje (se ve en la sección "Reporte").
 *
 *   consultar: consultarApi("/api/appweb/report-icc", filaSchema)
 *   consultar: consultarApi("/api/appweb/ENDPOINT", filaSchema, {
 *     lista: "detalle", // la lista viene en data.detalle
 *     params: { tipo: "mensual" }, // parámetro fijo
 *     nombres: { cod_empresa: "cod_emp" }, // el endpoint lo espera con otro nombre
 *     filtrar: (f, p) => fechaEnRango(f.fecha, p), // lo que el endpoint no filtra
 *   })
 */
export function consultarApi<TSchema extends z.ZodType>(
  endpoint: string,
  schema: TSchema,
  opciones: OpcionesConsultarApi & {
    /**
     * Lo que el endpoint no filtra, se filtra aquí: `true` = la fila se queda. Recibe la fila y
     * los parámetros de la pantalla (ej. `(f, p) => fechaEnRango(f.fecha, p)`).
     */
    filtrar?: (fila: z.output<TSchema>, params: ParamsReporte) => boolean;
  } = {},
) {
  return async (params: ParamsReporte): Promise<z.output<TSchema>[]> => {
    const enviados = Object.fromEntries(
      Object.entries(params).map(([clave, valor]) => [opciones.nombres?.[clave] ?? clave, valor]),
    );
    const filas = parseEnvelope(
      await http.get<unknown>(endpoint, { params: { ...enviados, ...opciones.params } }),
      schema,
      endpoint,
      opciones.lista ? { listKey: opciones.lista } : undefined,
    );
    const { filtrar } = opciones;
    return filtrar ? filas.filter((fila) => filtrar(fila, params)) : filas;
  };
}
