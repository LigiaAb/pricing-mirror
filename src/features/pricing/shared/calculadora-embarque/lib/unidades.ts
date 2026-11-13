import type { Unidad } from "./calculos";

/* ==========================================================================
 * UNIDADES DE MEDIDA Y PESO
 *
 * Salen de la relación de tipos: COORDINACION_CARGA hija de TIPO_MEDIDA,
 * con tipo_padre_desc "VOLUMEN" (medida) o "PESO".
 * ========================================================================== */

export type TipoMedida = "VOLUMEN" | "PESO";

type RelacionTipoUnidad = {
  value?: string | number | null;
  label?: unknown;
  cod_estado?: unknown;
  codEstado?: unknown;
  tipo_tabla?: unknown;
  tipo_padre_tabla?: unknown;
  tipo_padre_desc?: unknown;
  tipo_desc?: unknown;
};

/** ¿La relación de tipos es una unidad activa de VOLUMEN o PESO? */
export function esUnidadEmbarque(relacion: RelacionTipoUnidad, tipo: TipoMedida): boolean {
  return (
    Number(relacion.cod_estado ?? relacion.codEstado) === 1 &&
    relacion.tipo_tabla === "COORDINACION_CARGA" &&
    relacion.tipo_padre_tabla === "TIPO_MEDIDA" &&
    relacion.tipo_padre_desc === tipo
  );
}

/** Deja las unidades con la forma que usa la calculadora (sin value nulo, label texto). */
export function normalizarUnidades(
  unidades: ReadonlyArray<RelacionTipoUnidad> | undefined,
): Unidad[] {
  return (unidades ?? []).flatMap((unidad) => {
    if (unidad.value == null) return [];

    return [
      {
        ...unidad,
        value: unidad.value,
        label: unidad.label == null ? null : String(unidad.label),
        tipo_desc: unidad.tipo_desc == null ? null : String(unidad.tipo_desc),
        tipo_padre_desc: unidad.tipo_padre_desc == null ? null : String(unidad.tipo_padre_desc),
      },
    ];
  });
}
