import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { zId } from "@/shared/lib/zod-scalars";
import type { Filtros } from "../lib/filtros-types";

/** Registro de los resultados agrupados por usuario. */
const hitRateUsuarioSchema = z
  .object({
    total: z.number(),
    cotizaciones: z.string().nullable(),
    usuario: zId,
    nombres: z.string().nullable(),
    apellidos: z.string().nullable(),
    ausrid: z.string().nullable(),
  })
  .passthrough();

/** Los resultados por transporte incluyen la descripción del tipo. */
export const hitRateTransporteSchema = hitRateUsuarioSchema.extend({
  tipo: z.string().nullable(),
});

/** Registro agrupado por centro de costo. */
export const hitRateCentroCostoSchema = z
  .object({
    total: z.number(),
    cotizaciones: z.string().nullable(),
    nombres: z.string().nullable(),
    cc: zId,
  })
  .passthrough();

/** Contenido de data que devuelve report_hit_rate. */
export const reporteHitRateSchema = z
  .object({
    global_by_user: z.array(hitRateUsuarioSchema),
    confirmadas_by_user: z.array(hitRateUsuarioSchema),
    tipo_transporte_terrestre: z.array(hitRateTransporteSchema),
    confirmadas_tipo_transporte_terrestre: z.array(hitRateTransporteSchema),
    tipo_transporte_aereo: z.array(hitRateTransporteSchema),
    confirmadas_tipo_transporte_aereo: z.array(hitRateTransporteSchema),
    tipo_transporte_maritimo: z.array(hitRateTransporteSchema),
    confirmadas_tipo_transporte_maritimo: z.array(hitRateTransporteSchema),
    cc: z.array(hitRateCentroCostoSchema),
    confirmadas_cc: z.array(hitRateCentroCostoSchema),
  })
  .passthrough();

export const respuestaHitRateSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: reporteHitRateSchema,
  })
  .passthrough();

export type HitRateUsuario = z.infer<typeof hitRateUsuarioSchema>;
export type HitRateTransporte = z.infer<typeof hitRateTransporteSchema>;
export type HitRateCentroCosto = z.infer<typeof hitRateCentroCostoSchema>;
export type ReporteHitRate = z.infer<typeof reporteHitRateSchema>;
export type RespuestaHitRate = z.infer<typeof respuestaHitRateSchema>;

export const HIT_RATE_QUERY_KEY = ["reportes", "hit-rate"] as const;

/** Consulta el reporte y devuelve el objeto data con sus diez arreglos. */
export async function consultarHitRate(filtros: Filtros): Promise<ReporteHitRate> {
  const respuesta = await http.get<unknown>("/api/appweb/report_hit_rate", {
    params: {
      fecha_inicio: filtros.fecha_inicio,
      fecha_fin: filtros.fecha_fin,
      ...(filtros.cod_empresa ? { cod_empresa: filtros.cod_empresa?.codigo } : {}),
      ...(filtros.cod_cc ? { cod_cc: filtros.cod_cc?.codigo } : {}),
      ...(filtros.cod_tipo_pago ? { cod_tipo_pago: filtros.cod_tipo_pago?.value } : {}),
      ...(filtros.cod_usuario ? { cod_usuario: filtros.cod_usuario?.value } : {}),
      ...(filtros.cod_cliente ? { cod_cliente: filtros.cod_cliente?.value } : {}),
    },
  });

  const errorApi = z
    .object({ data: z.object({ success: z.literal(false), mensaje: z.string() }) })
    .safeParse(respuesta);

  if (errorApi.success) {
    throw new Error(errorApi.data.data.mensaje);
  }

  return respuestaHitRateSchema.parse(respuesta).data;
}

export const hitRateOptions = (filtros: Filtros) =>
  queryOptions({
    ...CACHE_DYNAMIC,
    queryKey: [...HIT_RATE_QUERY_KEY, filtros],
    queryFn: () => consultarHitRate(filtros),
    enabled: Boolean(filtros.fecha_inicio && filtros.fecha_fin),
  });

export function useHitRate(filtros: Filtros) {
  return useQuery(hitRateOptions(filtros));
}
