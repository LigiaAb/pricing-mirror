/* ==========================================================================
 * GESTIÓN DE ACTIVIDADES: MOTOR COMÚN (SOLO MAQUETA)
 *
 * Tipo y helpers para definir cómo se trabaja una actividad del tracking.
 * Las definiciones viven en la carpeta de cada actor:
 *
 *   OPS    → operaciones/lib/gestion-actividades.ts (GESTION_OPERACIONES)
 *   Bodega → bodegas/lib/gestion-actividades.ts     (GESTION_BODEGAS)
 *   CBX    → combex/lib/gestion-actividades.ts      (GESTION_COMBEX)
 *
 * Los campos `base` del tipo de interacción se agregan después de los propios.
 * ========================================================================== */

import type { CampoGestion, TipoInteraccion } from "./interacciones";
import { INTERACCIONES } from "./interacciones";

export type GestionActividad = {
  interaccion: TipoInteraccion;
  campos?: readonly CampoGestion[];
  /** Texto del botón (si no, el del tipo de interacción). */
  accion?: string;
  /** Referencia contra la que se compara (control del Excel). */
  compara?: string;
  /** Ids de actividades que deben estar hechas antes. */
  requiere?: readonly string[];
  /** Parte que aún no se maqueta en detalle. */
  pendiente?: string;
};

/** Definiciones de un actor: id de la actividad (`"OPS 2.1"`) → cómo se trabaja. */
export type DefinicionesGestion = Record<string, GestionActividad>;

const GESTION_DEFAULT: GestionActividad = { interaccion: "formulario" };

/** Definición de la actividad (sin entrada: formulario genérico). */
export function gestionDe(definiciones: DefinicionesGestion, idActividad: string): GestionActividad {
  return definiciones[idActividad] ?? GESTION_DEFAULT;
}

/** Campos de la actividad: los propios y después los base de su tipo. */
export function camposDe(gestion: GestionActividad): CampoGestion[] {
  return [...(gestion.campos ?? []), ...INTERACCIONES[gestion.interaccion].base];
}

export function accionDe(gestion: GestionActividad): string {
  return gestion.accion ?? INTERACCIONES[gestion.interaccion].accion;
}
