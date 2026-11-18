import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { zId, zIdNull } from "@/shared/lib/zod-scalars";

const TRUTHY = /^(s|si|sí|true|1|y|yes)$/i;

/**
 * `evaluar_creador` llega `null` en producción (64/64 filas verificadas); un
 * `zBool` estricto rompería `parseEnvelope` en la primera fila.
 */
const zBoolNull = z
  .union([z.boolean(), z.number(), z.string()])
  .nullable()
  .transform((v) => {
    if (v === null) return null;
    if (typeof v === "boolean") return v;
    return TRUTHY.test(String(v).trim());
  });

const objetivoSchema = z.object({
  cod_objetivo: zId,
  descripcion: z.string(),
  fecha_inicial: z.string(),
  fecha_final: z.string(),
  cantidad: z.number(),
  cod_tipo_actividad: zId,
  cod_emp: zId,
  cod_cc: zId,
  cod_estado: zId,
  cod_tipo_asignacion: zId,
  cod_periodicidad: zId,
  cod_usuario_creador: zIdNull,
  evaluar_creador: zBoolNull,
});

/** Estados válidos de un objetivo (D-2 del plan): la tabla real solo usa estos dos. */
export const COD_ESTADO_OBJETIVO = { ACTIVO: 1, INACTIVO: 2 } as const;

export interface Objetivo {
  codObjetivo: string | number;
  descripcion: string;
  fechaInicial: string;
  fechaFinal: string;
  cantidad: number;
  codTipoActividad: string | number;
  codEmp: string | number;
  codCc: string | number;
  codEstado: string | number;
  codTipoAsignacion: string | number;
  codPeriodicidad: string | number;
  codUsuarioCreador: string | number | null;
  evaluarCreador: boolean | null;
  value: string | number;
  label: string;
}

/**
 * El "eliminar" del legacy inactiva (`cod_estado: 2`), no borra la fila: los
 * objetivos son referencia histórica de las actividades evaluadas (D-1 del
 * plan de migración). `eliminar-objetivos` existe y queda disponible sin
 * cablear hasta que negocio pida el borrado real.
 */
export const objetivos = createCatalogo({
  nombre: "lista-objetivos",
  schema: objetivoSchema,
  endpoints: {
    lista: "/api/appweb/lista-objetivos",
    insertar: "/api/appweb/insertar-objetivos",
    actualizar: "/api/appweb/actualizar-objetivos",
    eliminar: "/api/appweb/eliminar-objetivos",
  },
  map: (raw): Objetivo => ({
    codObjetivo: raw.cod_objetivo,
    descripcion: raw.descripcion,
    fechaInicial: raw.fecha_inicial,
    fechaFinal: raw.fecha_final,
    cantidad: raw.cantidad,
    codTipoActividad: raw.cod_tipo_actividad,
    codEmp: raw.cod_emp,
    codCc: raw.cod_cc,
    codEstado: raw.cod_estado,
    codTipoAsignacion: raw.cod_tipo_asignacion,
    codPeriodicidad: raw.cod_periodicidad,
    codUsuarioCreador: raw.cod_usuario_creador,
    evaluarCreador: raw.evaluar_creador,
    value: raw.cod_objetivo,
    label: raw.descripcion,
  }),
});

/**
 * Payload de mutación (snake_case, forma del backend) a partir de la fila
 * mapeada. Usado por la acción de inactivar de la lista, que solo tiene el
 * `Objetivo` ya mapeado, no la fila cruda.
 */
export function aPayloadObjetivo(objetivo: Objetivo): Record<string, unknown> {
  return {
    cod_objetivo: objetivo.codObjetivo,
    descripcion: objetivo.descripcion,
    fecha_inicial: objetivo.fechaInicial,
    fecha_final: objetivo.fechaFinal,
    cantidad: objetivo.cantidad,
    cod_tipo_actividad: objetivo.codTipoActividad,
    cod_emp: objetivo.codEmp,
    cod_cc: objetivo.codCc,
    cod_estado: objetivo.codEstado,
    cod_tipo_asignacion: objetivo.codTipoAsignacion,
    cod_periodicidad: objetivo.codPeriodicidad,
    cod_usuario_creador: objetivo.codUsuarioCreador,
    evaluar_creador: objetivo.evaluarCreador,
  };
}
