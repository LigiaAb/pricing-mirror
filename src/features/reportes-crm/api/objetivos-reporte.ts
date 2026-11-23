import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zIdSafe } from "@/shared/lib/zod-scalars";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");
const actividad = z.looseObject({
  cod_actividad: zIdSafe,
  fecha_creada: texto,
  asunto: texto,
  descripcion: texto,
  cod_tipo: zIdSafe.optional(),
  fecha_programada: texto,
  cod_estado: zIdSafe.optional(),
  cod_asesor: zIdSafe.optional(),
});
const periodo = z.looseObject({
  fecha_inicial: texto,
  fecha_final: texto,
  numero: z.number().catch(0),
  actividades: z.array(actividad).catch([]),
});
const empleado = z.looseObject({
  cod_usuario: zIdSafe,
  nombre: texto,
  datos: z.array(periodo).catch([]),
});
export const objetivoReporteSchema = z.looseObject({
  descripcion: texto,
  fecha_inicial: texto,
  fecha_final: texto,
  cantidad: z.number().catch(0),
  cod_tipo_actividad: zIdSafe.optional(),
  tipo_descripcion: texto,
  cod_periodicidad: zIdSafe.optional(),
  periodicidad_descripcion: texto,
  periodicidad_dias: z.number().catch(0),
  periodicidad_unidad: texto,
  evaluar_creador: z.unknown().optional(),
  empleados: z.array(empleado).catch([]),
});
export type ObjetivoReporte = z.infer<typeof objetivoReporteSchema>;
export interface FiltrosObjetivosReporte {
  cod_emp: string | number;
  cod_cc: string | number;
  cod_tipo_asignacion: string | number;
  fecha_inicial: string;
  fecha_final: string;
  cod_usuario?: string | number;
}
const objetivosReporteOptions = (filtros: FiltrosObjetivosReporte) =>
  queryOptions({
    queryKey: ["reportes-crm", "objetivos", filtros],
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/reporte-objetivos", { params: { ...filtros } }),
        objetivoReporteSchema,
        "reporte-objetivos",
      ),
  });
export function useObjetivosReporte(filtros: FiltrosObjetivosReporte | null) {
  return useQuery({
    ...objetivosReporteOptions(
      filtros ?? {
        cod_emp: "",
        cod_cc: "",
        cod_tipo_asignacion: "",
        fecha_inicial: "",
        fecha_final: "",
      },
    ),
    enabled: Boolean(filtros),
  });
}
