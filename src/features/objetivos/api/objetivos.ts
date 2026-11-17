/* STUB del repo espejo: copia del catálogo real `objetivos` (pricing solo usa `useLista`). NO copiar al proyecto real. */
import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { zId, zIdNull } from "@/shared/lib/zod-scalars";

const TRUTHY = /^(s|si|sí|true|1|y|yes)$/i;

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
