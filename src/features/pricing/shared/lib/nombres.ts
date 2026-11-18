/* ==========================================================================
 * NOMBRES DE CATÁLOGO
 *
 * Algunas decisiones de negocio se toman por el nombre de un registro de
 * catálogo (tipo de transporte, rubro IVA, rubros de flete) y no por su código,
 * porque los códigos pueden ser distintos entre ambientes. Para que todas
 * comparen igual, el nombre se normaliza siempre con esta función.
 * ========================================================================== */

/** Nombre listo para comparar: sin espacios a los lados y en mayúsculas. */
export function normalizarNombre(valor: unknown): string {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

/** `true` si el nombre del registro es `nombre` (ver `normalizarNombre`). */
export function esNombre(valor: unknown, nombre: string): boolean {
  return normalizarNombre(valor) === normalizarNombre(nombre);
}
