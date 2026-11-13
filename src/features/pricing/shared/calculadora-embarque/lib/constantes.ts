/* ==========================================================================
 * CÓDIGOS DE EMBARQUE (corporativos)
 *
 * Valores fijos de la base de datos que usa la calculadora de embarques y que
 * cualquier módulo (Cotizaciones, Tarifas, ...) puede necesitar.
 * ========================================================================== */

/** cod_tipo_transporte */
export const TIPO_TRANSPORTE = {
  AEREO: 49,
  MARITIMO: 50,
  TERRESTRE: 51,
} as const;

/** Nombre de cada tipo de transporte por su código. */
export const TIPOS_TRANSPORTE = {
  [TIPO_TRANSPORTE.AEREO]: "AEREO",
  [TIPO_TRANSPORTE.MARITIMO]: "MARITIMO",
  [TIPO_TRANSPORTE.TERRESTRE]: "TERRESTRE",
} as const;

export type TipoTransporte = (typeof TIPOS_TRANSPORTE)[keyof typeof TIPOS_TRANSPORTE];

/** Unidades por defecto de la calculadora (cod_tipo de la relación de tipos). */
export const UNIDAD_DEFAULT = {
  /** Unidad de volumen / medida. */
  MEDIDA: 165,
  /** Unidad de peso. */
  PESO: 162,
} as const;
