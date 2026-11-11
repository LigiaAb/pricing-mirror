/* ==========================================================================
 * UTILIDADES COMPARTIDAS DE COTIZACIONES
 *
 * Funciones pequeñas y puras que antes estaban copiadas en varios archivos.
 * Si necesitas una de estas funciones, impórtala desde aquí en lugar de
 * volver a escribirla.
 * ========================================================================== */

import { format, isValid, parseISO } from "date-fns";

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
 * BOOLEANOS
 * ========================================================================== */

/** Convierte true/false, 1/0, "1"/"0", "si"/"no", "true"/"false", "y"/"n"... a boolean. */
export function normalizarBoolean(value: unknown) {
  if (value === true || value === false) {
    return value;
  }

  if (value == null) {
    return false;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalizado = value.trim().toLowerCase();

    if (["1", "true", "si", "sí", "y", "yes"].includes(normalizado)) {
      return true;
    }

    if (["0", "false", "no", "n"].includes(normalizado)) {
      return false;
    }
  }

  return Boolean(value);
}

/* ==========================================================================
 * NÚMEROS
 * ========================================================================== */

/** Deja solo dígitos y punto de lo que escribe el usuario en un input numérico. */
export function limpiarNumero(raw: unknown) {
  return String(raw ?? "").replace(/[^0-9.]/g, "");
}

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
export function simboloDeMoneda(
  moneda?: Pick<MonedaCatalogo, "SIMBOLO_MONEDA" | "simbolo_moneda"> | null,
) {
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
