export type ValoresCriterios = Record<string, unknown>;

type CatalogOption = {
  value?: unknown;

  [key: string]: unknown;
};

/* ==========================================================================
 * HELPERS INTERNOS
 * ========================================================================== */

function esCatalogOption(value: unknown): value is CatalogOption {
  return value !== null && typeof value === "object" && "value" in value;
}

/* ==========================================================================
 * BOOLEAN
 * ========================================================================== */

/**
 * Replica normalizeBool del Grid legado.
 *
 * Se utiliza principalmente para `express`.
 */
export function normalizarBooleanCriterio(value: unknown): boolean {
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
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "si", "sí", "y", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }

  return Boolean(value);
}

/* ==========================================================================
 * PREPARAR CRITERIOS PARA CÁLCULO
 * ========================================================================== */

/**
 * Convierte el estado del formulario al formato esperado
 * por los endpoints de cálculo.
 *
 * Actualmente solo existe una conversión de catálogo
 * explícita en el comportamiento legado:
 *
 * cod_commodity:
 *   { value, label } -> value
 *
 * Además:
 *
 * categoria_transporte:
 *   "0" -> null
 *
 * `express` se garantiza como boolean porque el Grid
 * también lo normaliza antes de guardar criterios.
 */
export function prepararCriteriosCalculo(valores: ValoresCriterios): ValoresCriterios {
  const commodity = valores.cod_commodity;

  const categoriaTransporte = valores.categoria_transporte;

  return {
    ...valores,

    cod_commodity: esCatalogOption(commodity) ? commodity.value : commodity,

    categoria_transporte: String(categoriaTransporte ?? "") === "0" ? null : categoriaTransporte,

    express: normalizarBooleanCriterio(valores.express),
  };
}

/* ==========================================================================
 * CRITERIOS QUE AFECTAN LA BÚSQUEDA DE FLETE
 * ========================================================================== */

/**
 * Obtiene únicamente los criterios que deben provocar
 * una nueva búsqueda de opciones de flete.
 *
 * El Grid legado excluye exactamente:
 *
 * - valor_flete
 * - flete_fuente
 * - express
 * - categoria_transporte
 *
 * porque esos valores aparecen después o como consecuencia
 * de haber obtenido/seleccionado el flete.
 */
export function obtenerCriteriosParaFlete(criterios: ValoresCriterios): ValoresCriterios {
  const {
    valor_flete: _valorFlete,
    flete_fuente: _fleteFuente,
    express: _express,
    categoria_transporte: _categoriaTransporte,

    ...rest
  } = criterios;

  return rest;
}
