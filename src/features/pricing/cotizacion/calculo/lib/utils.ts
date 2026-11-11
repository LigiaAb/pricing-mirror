/* ==========================================================================
 * UTILIDADES COMPARTIDAS DE COTIZACIONES
 *
 * Funciones pequeñas y puras que antes estaban copiadas en varios archivos.
 * Si necesitas una de estas funciones, impórtala desde aquí en lugar de
 * volver a escribirla.
 * ========================================================================== */

import { endOfDay, format, isAfter, isValid, isWithinInterval, parseISO, startOfDay, subDays } from "date-fns";

import type { Id, MonedaCatalogo, Registro } from "./tipos";

/* ==========================================================================
 * IDS / OBJETOS
 * ========================================================================== */

/** Compara dos ids sin importar si vienen como texto o número. `null` nunca es igual. */
export function mismoId(a: unknown, b: unknown) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/** `true` si el valor es un objeto (no null). */
export function esRegistro(value: unknown): value is Registro {
  return typeof value === "object" && value !== null;
}

/** Devuelve el valor como objeto, o `{}` si no lo es. */
export function registro(value: unknown): Registro {
  return esRegistro(value) ? value : {};
}

/* ==========================================================================
 * NÚMEROS
 * ========================================================================== */

/** Convierte a número; si no es un número válido devuelve 0. */
export function numero(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

const FORMATO_NUMERO = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea con 2 decimales y separador de miles: 1234.5 → "1,234.50". */
export function formatNumero(value?: string | number | null) {
  return FORMATO_NUMERO.format(numero(value));
}

/* ==========================================================================
 * MONEDAS
 * ========================================================================== */

/** Busca una moneda del catálogo por su código. */
export function buscarMoneda<T extends Pick<MonedaCatalogo, "cod_moneda">>(
  monedas: T[],
  codMoneda?: Id | null,
): T | null {
  if (codMoneda == null) return null;
  return monedas.find((moneda) => mismoId(moneda.cod_moneda, codMoneda)) ?? null;
}

/** Símbolo de una moneda ya encontrada ("Q", "$", ...). */
export function simboloDeMoneda(moneda?: Pick<MonedaCatalogo, "SIMBOLO_MONEDA" | "simbolo_moneda"> | null) {
  return moneda?.SIMBOLO_MONEDA ?? moneda?.simbolo_moneda ?? "";
}

/** Símbolo de la moneda con ese código dentro del catálogo. */
export function getSimboloMoneda(monedas: MonedaCatalogo[], codMoneda?: Id | null) {
  return simboloDeMoneda(buscarMoneda(monedas, codMoneda));
}

/* ==========================================================================
 * FECHAS
 * ========================================================================== */

/** Fecha como "dd/MM/yyyy". Vacío → "—"; texto que no es fecha → se devuelve tal cual. */
export function formatFecha(value: string | Date | null | undefined) {
  if (!value) {
    return "—";
  }

  const fecha = value instanceof Date ? value : parseISO(value);

  if (!isValid(fecha)) {
    return String(value);
  }

  return format(fecha, "dd/MM/yyyy");
}

/**
 * Estado de vigencia de un método según su fecha final:
 * - vencida: la fecha ya pasó.
 * - proximaAVencer: vence en los próximos 15 días.
 */
export function getEstadoMetodo(fecha?: Date | string | null) {
  const sinEstado = { vencida: false, proximaAVencer: false };

  if (!fecha) return sinEstado;

  const fechaFinal = fecha instanceof Date ? fecha : new Date(fecha);

  if (!isValid(fechaFinal)) return sinEstado;

  const ahora = new Date();
  const vencida = isAfter(ahora, fechaFinal);

  const proximaAVencer =
    !vencida &&
    isWithinInterval(startOfDay(ahora), {
      start: startOfDay(subDays(fechaFinal, 15)),
      end: endOfDay(fechaFinal),
    });

  return { vencida, proximaAVencer };
}

/* ==========================================================================
 * CRITERIOS
 * ========================================================================== */

/**
 * Llave estable de un objeto de criterios (ordenada por nombre de campo).
 * Sirve para detectar si los criterios cambiaron y hay que recalcular.
 */
export function crearKeyCriterios(criterios: Record<string, unknown>) {
  return Object.keys(criterios)
    .sort()
    .map((key) => {
      const value = criterios[key];

      if (value != null && typeof value === "object") {
        try {
          return `${key}:${JSON.stringify(value)}`;
        } catch {
          return `${key}:${String(value)}`;
        }
      }

      return `${key}:${String(value ?? "")}`;
    })
    .join("|");
}
