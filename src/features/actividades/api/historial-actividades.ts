import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zIdSafe } from "@/shared/lib/zod-scalars";
import { fechaActividad } from "./actividades";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");

export const historialActividadSchema = z.looseObject({
  cod_actividad: zIdSafe,
  fecha_creada: fechaActividad,
  asunto: texto,
  descripcion: texto,
  nom_tipo: texto,
  fecha_programada: fechaActividad,
  cod_cenco: zIdSafe.optional(),
  nombre_cenco: texto,
  cod_empresa: zIdSafe.optional(),
  nombre_empresa: texto,
  estado_desc: texto,
  cod_creador: zIdSafe.optional(),
  nombre_usuario: texto,
  resultado: texto,
});

export type HistorialActividad = z.infer<typeof historialActividadSchema>;

export function useHistorialActividades(entidadId: string | number | null) {
  return useQuery({
    queryKey: ["actividades", "historial", entidadId],
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/historial-actividades", {
          params: { entidad_id: entidadId },
        }),
        historialActividadSchema,
        "historial-actividades",
      ),
    enabled: entidadId != null,
  });
}
