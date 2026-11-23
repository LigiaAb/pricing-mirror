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
export const actividadReporteSchema = z.looseObject({
  cod_actividad: zIdSafe,
  fecha_creada: texto,
  fecha_programada: texto,
  asunto: texto,
  descripcion: texto,
  cod_tipo: zIdSafe.optional(),
  nom_tipo: texto,
  cod_emp: zIdSafe.optional(),
  cod_cc: zIdSafe.optional(),
  cod_estado: zIdSafe.optional(),
  estado_desc: texto,
  cod_asesor: zIdSafe.optional(),
  cod_creador: zIdSafe.optional(),
  cod_cliente: zIdSafe.nullable().optional(),
  nombre_cliente: texto,
  cod_documento: texto,
  cod_objetivo_actividad: zIdSafe.nullable().optional(),
  objetivo_actividad_desc: texto,
  contacto: texto,
  resultado: texto,
});
export type ActividadReporte = z.infer<typeof actividadReporteSchema>;
export interface FiltrosActividadesReporte {
  cod_empresa?: string | number;
  cod_cc?: string | number;
  cod_asesor?: string | number;
  cod_estado?: string | number;
}
const actividadesReporteOptions = (filtros: FiltrosActividadesReporte) =>
  queryOptions({
    queryKey: ["reportes-crm", "actividades", filtros],
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-actividades2", { params: { ...filtros } }),
        actividadReporteSchema,
        "lista-actividades2",
      ),
    enabled: Boolean(filtros.cod_empresa || filtros.cod_cc || filtros.cod_asesor),
  });
export function useActividadesReporte(filtros: FiltrosActividadesReporte | null) {
  return useQuery({
    ...actividadesReporteOptions(filtros ?? { cod_empresa: "", cod_cc: "" }),
    enabled: Boolean(filtros),
  });
}
