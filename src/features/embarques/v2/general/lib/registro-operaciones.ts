/* ==========================================================================
 * REGISTRO DE OPERACIONES
 *
 * Una definición por clave (`shared/lib/operacion.ts`). Agregar una operación
 * = su archivo en `operaciones/` + 1 entrada en `OPERACIONES` (y, mientras no
 * venga del backend, su transporte en `OPERACION_POR_TRANSPORTE`).
 * ========================================================================== */

import type { ClaveOperacion, DefinicionOperacion } from "../../shared/lib/operacion";
import type { EmbarqueMaqueta } from "../../shared/lib/tipos";
import { AEREO_EXPO } from "./operaciones/aereo-expo";

export const OPERACIONES: Readonly<Partial<Record<ClaveOperacion, DefinicionOperacion>>> = {
  "aereo-expo": AEREO_EXPO,
};

/**
 * Operación por tipo de transporte (sin tildes, en mayúsculas).
 * Pendiente (#122): el campo del backend que dice si el embarque es de
 * exportación o importación; mientras tanto, todo es exportación.
 */
const OPERACION_POR_TRANSPORTE: Readonly<Record<string, ClaveOperacion>> = {
  AEREO: "aereo-expo",
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();
}

/** Operación del embarque (null = su operación aún no está definida). */
export function operacionDeEmbarque(embarque: EmbarqueMaqueta): DefinicionOperacion | null {
  const clave = OPERACION_POR_TRANSPORTE[normalizar(embarque.tipoTransporte)];
  return (clave && OPERACIONES[clave]) ?? null;
}
