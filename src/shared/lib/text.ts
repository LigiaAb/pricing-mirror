/**
 * Safe conversion of an unknown value to string for use in HTML inputs and text contexts.
 *
 * Rules:
 *   null / undefined → ""
 *   string           → as-is
 *   number / boolean → String(v)
 *   anything else    → "" (avoids "[object Object]" in inputs)
 */
export function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/**
 * Safe conversion of an unknown value to string with a custom fallback.
 *
 * Rules:
 *   null / undefined → fallback
 *   string           → as-is
 *   number / boolean → String(v)
 *   anything else    → fallback
 */
export function asTextOr(value: unknown, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

/**
 * Safe conversion of an unknown value to number for use in arithmetic or numeric props.
 *
 * Rules:
 *   null / undefined → fallback (default 0)
 *   number           → as-is (NaN → fallback)
 *   string           → Number(v); NaN → fallback
 *   boolean          → 1 / 0
 *   anything else    → fallback
 */
export function asNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    if (value.trim() === "") return fallback;
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

/**
 * Normaliza texto para comparaciones de búsqueda: descompone los acentos y los
 * descarta, y pasa a minúsculas. Así "Peten" encuentra "Petén" y viceversa,
 * que es lo que el usuario espera al teclear sin acentos en un selector.
 */
export function normalizarBusqueda(texto: string): string {
  return texto.normalize("NFD").replaceAll(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Convierte texto libre a kebab-case mientras el usuario escribe: minúsculas,
 * sin acentos, y cualquier corrida de caracteres no alfanuméricos (espacios,
 * símbolos, guiones repetidos) colapsada a un solo "-".
 */
export function toKebabCase(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-");
}

/** Normaliza banderas de peligrosidad del backend ("S", "si", "1", "true"...) a boolean. */
export function normalizePeligrosidad(value: unknown): boolean {
  return /^(s|si|true|1|y|yes)$/i.test(asText(value).trim());
}

/**
 * Safe conversion of an unknown value to string for human-readable labels.
 *
 * Rules:
 *   null / undefined / "" → fallback (default "")
 *   string (non-empty)    → as-is
 *   number / boolean      → String(v)
 *   anything else         → fallback (avoids "[object Object]" in labels)
 *
 * Difference from `asTextOr`: treats empty string as missing value.
 */
export function safeString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value === "" ? fallback : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}
