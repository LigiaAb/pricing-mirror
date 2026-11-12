import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { zId } from "@/shared/lib/zod-scalars";
import type { Filtros } from "../lib/filtros-types";
import { paramsReporte, validarRespuestaReporte } from "./params-reporte";

/** Keys en minúsculas, como las entrega el cliente de API. */
export const realizacionDePrecioUsuarioSchema = z
  .object({
    total: z.number(),
    cotizaciones: z.string().nullable(),
    usuario: zId,
    nombres: z.string().nullable(),
    apellidos: z.string().nullable(),
    ausrid: z.string().nullable(),
    tipo_pago: z.string().nullable().optional(),
  })
  .passthrough();

export const reporteRealizacionDePrecioSchema = z
  .object({
    by_user_original: z.array(realizacionDePrecioUsuarioSchema),
    by_user_bajo: z.array(realizacionDePrecioUsuarioSchema),
    by_user_alto: z.array(realizacionDePrecioUsuarioSchema),
    global_by_user: z.array(realizacionDePrecioUsuarioSchema),
  })
  .passthrough();

export const respuestaRealizacionDePrecioSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: reporteRealizacionDePrecioSchema,
  })
  .passthrough();

export type RealizacionDePrecioUsuario = z.infer<typeof realizacionDePrecioUsuarioSchema>;
export type ReporteRealizacionDePrecio = z.infer<typeof reporteRealizacionDePrecioSchema>;
export type RespuestaRealizacionDePrecio = z.infer<typeof respuestaRealizacionDePrecioSchema>;

export const REALIZACION_DE_PRECIO_QUERY_KEY = ["reportes", "realizacion-de-precio"] as const;

export async function consultarRealizacionDePrecio(
  filtros: Filtros,
): Promise<ReporteRealizacionDePrecio> {
  const respuesta = await http.get<unknown>("/api/appweb/report_realizacion_de_precio", {
    params: paramsReporte(filtros),
  });

  validarRespuestaReporte(respuesta);

  return respuestaRealizacionDePrecioSchema.parse(respuesta).data;
}

export const realizacionDePrecioOptions = (filtros: Filtros) =>
  queryOptions({
    ...CACHE_DYNAMIC,
    queryKey: [...REALIZACION_DE_PRECIO_QUERY_KEY, paramsReporte(filtros)],
    queryFn: () => consultarRealizacionDePrecio(filtros),
    enabled: Boolean(
      filtros.fecha_inicio &&
        filtros.fecha_fin &&
        filtros.cod_empresa != null &&
        filtros.cod_cc != null,
    ),
  });

export function useRealizacionDePrecio(filtros: Filtros) {
  return useQuery(realizacionDePrecioOptions(filtros));
}
