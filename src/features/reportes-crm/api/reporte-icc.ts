import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");
const bandera = z.coerce.number().catch(0);

/**
 * Una actividad (LLAMADA o VISITA) de `report_icc`, con la fecha programada en el rango; solo los
 * campos que usa el cálculo. Fechas en UTC (ISO).
 */
export const filaIccSchema = z.looseObject({
  fecha_creacion: texto,
  fecha_programacion: texto,
  tipo: texto,
  usuario: zId,
  nombres: texto,
  apellidos: texto,
  estado: texto,
  con_resultado: bandera,
  finalizada: bandera,
});

export type FilaIcc = z.infer<typeof filaIccSchema>;

/** Parámetros de `report_icc`: fechas `YYYY-MM-DD` (requeridas) y filtros opcionales. */
export type ParamsReporteIcc = {
  fecha_inicio: string;
  fecha_fin: string;
  cod_empresa?: number | undefined;
  cod_cc?: number | undefined;
  cod_usuario?: number | undefined;
};

export const reporteIccOptions = (params: ParamsReporteIcc) =>
  queryOptions({
    ...CACHE_DYNAMIC,
    queryKey: ["actividades", "reporte-icc", params] as const,
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/report-icc", { params }),
        filaIccSchema,
        "report_icc",
      ),
  });

export function useReporteIcc(params: ParamsReporteIcc, enabled = true) {
  return useQuery({ ...reporteIccOptions(params), enabled });
}
