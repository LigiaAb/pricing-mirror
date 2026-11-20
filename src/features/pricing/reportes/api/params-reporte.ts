import { z } from "zod";

import type { Filtros } from "../lib/filtros-types";

/**
 * Parámetros que se envían a los endpoints de reportes.
 * También se usan como queryKey: filtros solo visuales (reporte, tipo de transporte)
 * no deben provocar una consulta nueva.
 */
export function paramsReporte(filtros: Filtros) {
  return {
    fecha_inicio: filtros.fecha_inicio,
    fecha_fin: filtros.fecha_fin,
    ...(filtros.cod_empresa ? { cod_empresa: filtros.cod_empresa.codigo } : {}),
    ...(filtros.cod_cc ? { cod_cc: filtros.cod_cc.codigo } : {}),
    ...(filtros.cod_tipo_pago ? { cod_tipo_pago: filtros.cod_tipo_pago.value } : {}),
    ...(filtros.cod_usuario ? { cod_usuario: filtros.cod_usuario.value } : {}),
    ...(filtros.cod_cliente ? { cod_cliente: filtros.cod_cliente.value } : {}),
  };
}

export type ParamsReporte = ReturnType<typeof paramsReporte>;

const errorApiSchema = z.object({
  data: z.object({
    success: z.literal(false),
    mensaje: z.string().optional(),
    /** El `catch` de los reportes devuelve el error de la consulta aquí, sin `mensaje`. */
    error: z.string().optional(),
  }),
});

/** Lanza el mensaje del backend cuando la respuesta trae data.success = false. */
export function validarRespuestaReporte(respuesta: unknown): void {
  const errorApi = errorApiSchema.safeParse(respuesta);
  if (errorApi.success) {
    const { mensaje, error } = errorApi.data.data;
    throw new Error(mensaje ?? error ?? "El reporte respondió con error");
  }
}
