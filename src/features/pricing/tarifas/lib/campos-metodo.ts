/* ==========================================================================
 * MÉTODOS DE TARIFA: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * El motor vive en pricing/shared/lib/campos-metodo.ts (la definición de
 * rango también la usa Cotizaciones). Aquí solo se reexporta para que las
 * definiciones de tarifas/lib/metodos/ lo importen de "../campos-metodo".
 * ========================================================================== */

export {
  booleano,
  type CampoBooleano,
  type CampoContexto,
  type CampoFijo,
  type CampoMoneda,
  type CampoMonto,
  type CampoOpcion,
  type CampoRubro,
  type CatalogosMetodo,
  type ContextoMetodo,
  type DefCampo,
  definirMetodo,
  delContexto,
  type ErrorRegla,
  fijo,
  type FormularioCampo,
  moneda,
  monto,
  opcion,
  type PayloadMetodo,
  rangoPermitido,
  type ReglaMetodo,
  type ResultadoValidacion,
  rubro,
  sinEsquema,
  ventaNoMenorQueCosto,
} from "@/features/pricing/shared";
