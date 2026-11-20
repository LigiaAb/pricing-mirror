import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { zIdSafe, zIdSafeNull } from "@/shared/lib/zod-scalars";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");

/** Contrato de `lista-actividades`, normalizado por el cliente HTTP. */
export const actividadSchema = z.looseObject({
  cod_actividad: zIdSafe,
  fecha_creada: texto,
  fecha_programada: texto,
  asunto: texto,
  descripcion: texto,
  cod_tipo: zIdSafe,
  nom_tipo: texto,
  cod_cliente: zIdSafeNull,
  nombre_cliente: texto,
  cod_emp: zIdSafe,
  cod_cc: zIdSafe,
  cod_estado: zIdSafe,
  estado_desc: texto,
  cod_asesor: zIdSafeNull,
  cod_creador: zIdSafeNull,
  cod_campana: zIdSafeNull,
  cod_documento: texto,
  cod_objetivo_actividad: zIdSafeNull,
  objetivo_actividad_desc: texto,
  cod_cropa: texto,
});

export type Actividad = z.infer<typeof actividadSchema>;

/** Payload explícito del contrato real; evita reenviar propiedades de presentación. */
export function aPayloadActividad(actividad: Actividad): Record<string, unknown> {
  return {
    cod_actividad: actividad.cod_actividad,
    fecha_creada: actividad.fecha_creada,
    fecha_programada: actividad.fecha_programada,
    asunto: actividad.asunto,
    descripcion: actividad.descripcion,
    cod_tipo: actividad.cod_tipo,
    cod_cliente: actividad.cod_cliente,
    cod_emp: actividad.cod_emp,
    cod_cc: actividad.cod_cc,
    cod_estado: actividad.cod_estado,
    cod_asesor: actividad.cod_asesor,
    cod_creador: actividad.cod_creador,
    cod_campana: actividad.cod_campana,
    cod_documento: actividad.cod_documento,
    cod_objetivo_actividad: actividad.cod_objetivo_actividad,
  };
}

/** Actividades son transaccionales: nunca se cachean como un catálogo estático. */
export const actividades = createCatalogo({
  nombre: "actividades",
  schema: actividadSchema,
  endpoints: {
    lista: "/api/appweb/lista-actividades",
    insertar: "/api/appweb/insertar-actividad",
    actualizar: "/api/appweb/actualizar-actividad",
  },
  cache: CACHE_DYNAMIC,
});
