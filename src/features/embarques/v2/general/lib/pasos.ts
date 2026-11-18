/* ==========================================================================
 * PASOS Y PERMISOS DE UNA OPERACIÓN
 *
 * Los pasos del tracking y las tabs viven en la definición de cada operación
 * (`lib/operaciones/<operacion>.ts`, registradas en `registro-operaciones.ts`).
 * Aquí, solo las reglas que valen para todas: estado de un paso, qué tabs y
 * actividades ve cada perfil y qué puede editar.
 * ========================================================================== */

import type { ActividadTracking } from "../../shared/lib/actividades-tracking";
import {
  actividadesPorId,
  type DefinicionOperacion,
  type PasoEmbarque,
  perfilDeResponsable,
  responsablesDe,
} from "../../shared/lib/operacion";
import type { EstadoPaso, PerfilEmbarque } from "../../shared/lib/tipos";

export function estadoPaso(idPaso: number, pasoActual: number): EstadoPaso {
  if (idPaso < pasoActual) return "completado";
  if (idPaso === pasoActual) return "actual";
  return "pendiente";
}

/* --------------------------------------------------------------------------
 * PERMISOS POR PERFIL
 *
 * - Operaciones orquesta el embarque: ve todas las tabs y todas las
 *   actividades, pero solo edita las de OPS; las de Bodega y Combex las ve
 *   en solo consulta.
 * - Bodegas y Combex ven solo su parte: las tabs con actividades de su área
 *   y, dentro de ellas, solo sus actividades.
 * - Información la ven todos; solo Operaciones la edita.
 * - Archivos la ven todos (solo consulta y descarga).
 * - Cancelación: solo Operaciones.
 * ------------------------------------------------------------------------ */

/** Perfiles que ven la tab. */
export function perfilesDeTab(
  operacion: DefinicionOperacion,
  paso: PasoEmbarque,
): PerfilEmbarque[] {
  const perfiles = new Set<PerfilEmbarque>(["operaciones"]);
  const actividades = actividadesPorId(operacion, paso.actividades);
  const responsables =
    actividades.length > 0
      ? actividades.map((actividad) => actividad.responsable)
      : paso.paraTodos
        ? responsablesDe(operacion)
        : [];
  for (const responsable of responsables) {
    const perfil = perfilDeResponsable(operacion, responsable);
    if (perfil) perfiles.add(perfil);
  }
  return [...perfiles];
}

export function pasosDelPerfil(
  operacion: DefinicionOperacion,
  perfil: PerfilEmbarque,
): PasoEmbarque[] {
  return operacion.tabs.filter((paso) => perfilesDeTab(operacion, paso).includes(perfil));
}

/** Actividades de la tab que ve el perfil (Operaciones: todas; los demás: las de su área). */
export function actividadesDelPerfil(
  operacion: DefinicionOperacion,
  paso: PasoEmbarque,
  perfil: PerfilEmbarque,
): ActividadTracking[] {
  const actividades = actividadesPorId(operacion, paso.actividades);
  if (perfil === "operaciones") return actividades;
  return actividades.filter((actividad) => puedeEditar(operacion, actividad, perfil));
}

/** El perfil edita solo las actividades de su área. */
export function puedeEditar(
  operacion: DefinicionOperacion,
  actividad: ActividadTracking,
  perfil: PerfilEmbarque,
): boolean {
  return perfilDeResponsable(operacion, actividad.responsable) === perfil;
}

/** Información: la edita solo Operaciones. */
export function puedeEditarInformacion(perfil: PerfilEmbarque): boolean {
  return perfil === "operaciones";
}

/**
 * Paso del tracking de una tab: el último paso de sus actividades
 * (null = la tab no depende de un paso, p. ej. Información o Archivos).
 * Cancelación (OPS 4.4) es una excepción y no se marca como completada.
 */
export function pasoDeTab(operacion: DefinicionOperacion, paso: PasoEmbarque): number | null {
  if (paso.grupo !== "flujo") return null;
  const pasos = actividadesPorId(operacion, paso.actividades).map((actividad) => actividad.paso);
  return pasos.length > 0 ? Math.max(...pasos) : null;
}
