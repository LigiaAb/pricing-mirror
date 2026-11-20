import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { zId } from "@/shared/lib/zod-scalars";
import type { Filtros } from "../lib/filtros-types";
import { paramsReporte, validarRespuestaReporte } from "./params-reporte";

/** Reportes que atiende `report_kpi_cotizaciones` (parámetro `reporte`). */
export type ReporteKpi = "hit_rate" | "realizacion_de_precio";

const texto = z.string().nullable().optional();
const bandera = z.coerce.number().catch(0);

/**
 * Una cotización (cabecera) del detalle; keys en minúsculas, como las entrega el cliente de API.
 * `realizada`: creada en el rango (primera versión). `cerrada`: confirmada con aprobación en el rango.
 * El dueño (`usuario`) es el creador de la primera versión.
 */
export const filaKpiSchema = z
  .object({
    cotizacion: zId,
    fecha_creacion: texto,
    fecha_aprobacion: texto,
    usuario: zId,
    nombres: texto,
    apellidos: texto,
    cc: zId.nullable().optional(),
    cc_nombre: texto,
    transporte: texto,
    tipo_pago: texto,
    cliente: texto,
    estado: texto,
    realizada: bandera,
    cerrada: bandera,
    /** Solo Realización de Precio, en las cerradas. */
    tipo_precio: z.enum(["SOBRE_TARIFA", "SPOT", "TARIFA_PUBLICADA"]).nullable().optional(),
  })
  .passthrough();

export const respuestaKpiSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.object({ reporte: z.string(), filas: z.array(filaKpiSchema) }).passthrough(),
  })
  .passthrough();

export type FilaKpi = z.infer<typeof filaKpiSchema>;

export const KPI_COTIZACIONES_QUERY_KEY = ["reportes", "kpi-cotizaciones"] as const;

/** Consulta el detalle del reporte: una fila por cotización. */
export async function consultarKpiCotizaciones(
  filtros: Filtros,
  reporte: ReporteKpi,
): Promise<FilaKpi[]> {
  const respuesta = await http.get<unknown>("/api/appweb/report_kpi_cotizaciones", {
    params: { ...paramsReporte(filtros), reporte },
  });

  validarRespuestaReporte(respuesta);

  return respuestaKpiSchema.parse(respuesta).data.filas;
}

export const kpiCotizacionesOptions = (filtros: Filtros, reporte: ReporteKpi) =>
  queryOptions({
    ...CACHE_DYNAMIC,
    queryKey: [...KPI_COTIZACIONES_QUERY_KEY, reporte, paramsReporte(filtros)],
    queryFn: () => consultarKpiCotizaciones(filtros, reporte),
    enabled: Boolean(filtros.fecha_inicio && filtros.fecha_fin),
  });

export function useKpiCotizaciones(filtros: Filtros, reporte: ReporteKpi) {
  return useQuery(kpiCotizacionesOptions(filtros, reporte));
}
