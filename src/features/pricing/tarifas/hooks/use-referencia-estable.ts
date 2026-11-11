import React from "react";

/* ==========================================================================
 * REFERENCIA ESTABLE
 *
 * Devuelve el MISMO objeto/arreglo de la vez anterior mientras su contenido
 * no cambie, aunque llegue una referencia nueva.
 *
 * Por qué existe: React Query conserva la referencia de los datos cuando una
 * recarga trae lo mismo, EXCEPTO si contienen objetos Date (ej. métodos usa
 * z.coerce.date()). En ese caso cada recarga entrega un arreglo nuevo y las
 * tablas (TanStack) regresan a la página 1 aunque nada haya cambiado.
 * ========================================================================== */

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  if (typeof valor !== "object" || valor === null) return false;
  const proto = Object.getPrototypeOf(valor);
  return proto === Object.prototype || proto === null;
}

/** Igualdad profunda para datos de tablas: primitivos, Date, arreglos y objetos planos. */
export function sonIguales(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => sonIguales(item, b[i]));
  }

  if (esObjetoPlano(a) && esObjetoPlano(b)) {
    const llavesA = Object.keys(a);
    if (llavesA.length !== Object.keys(b).length) return false;
    return llavesA.every((llave) => Object.prototype.hasOwnProperty.call(b, llave) && sonIguales(a[llave], b[llave]));
  }

  return false;
}

/** Conserva la referencia anterior de `valor` mientras su contenido sea igual. */
export function useReferenciaEstable<T>(valor: T): T {
  const anterior = React.useRef(valor);

  if (anterior.current !== valor && !sonIguales(anterior.current, valor)) {
    anterior.current = valor;
  }

  return anterior.current;
}
