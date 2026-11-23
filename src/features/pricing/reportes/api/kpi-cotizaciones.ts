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
 * Hit Rate: `realizada` = creada en el rango (primera versión); `cerrada` = confirmada con
 * aprobación en el rango; el dueño (`usuario`) es el creador de la primera versión.
 * Realización de Precio (igual que report_realizacion_de_precio): versión activa creada en el
 * rango; `realizada` siempre 1; `cerrada` = confirmada; el dueño es el creador de la versión activa.
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
    /** Para buscar la cabecera completa en la ficha (filtros de lista-cotizacion-cabecera). */
    cod_cliente: zId.nullable().optional(),
    cod_empresa: zId.nullable().optional(),
    estado: texto,
    /**
     * Origen y destino de la cabecera: nombre y código del punto de enlace o, si no hay
     * (terrestre), de la ciudad; el país, del punto de enlace o de la ciudad.
     */
    origen: texto,
    origen_codigo: texto,
    origen_pais: texto,
    destino: texto,
    destino_codigo: texto,
    destino_pais: texto,
    /** Proveedores de los rubros de flete de la versión activa ("A / B" si hay varios). */
    carrier: texto,
    realizada: bandera,
    cerrada: bandera,
    /**
     * Solo Realización de Precio, en las cerradas (igual que report_realizacion_de_precio):
     * sin Spot activo; con algún Spot de venta menor a la original; con alguno mayor.
     * Una cotización puede tener `spot_bajo` y `spot_alto` a la vez.
     */
    sin_spot: bandera,
    spot_bajo: bandera,
    spot_alto: bandera,
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
