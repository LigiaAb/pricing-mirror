import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

const normalizeCalcularTarifaParams = (params = {}) => {
  const normalized = { ...params };

  if (normalized.cod_clasificacion_carga != null && normalized.cod_clasificacion_carga !== "") {
    normalized.clasificacion = normalized.cod_clasificacion_carga;
  }
  delete normalized.cod_clasificacion_carga;

  if ((normalized.rate_costo == null || normalized.rate_costo === "") && normalized.RATE_COSTO != null) {
    normalized.rate_costo = normalized.RATE_COSTO;
  }
  delete normalized.RATE_COSTO;

  if ((normalized.rate_venta == null || normalized.rate_venta === "") && normalized.RATE_VENTA != null) {
    normalized.rate_venta = normalized.RATE_VENTA;
  }
  delete normalized.RATE_VENTA;

  return normalized;
};

/**
 * Fetch function for the "calcular-tarifa" endpoint.
 * Returns the array of rubros, each containing their SERVICIOS with METODO data.
 *
 * @param {Object} params
 * @param {number|string} params.cod_tarifaplantilla
 * @param {number|string} params.cod_empresa
 * @param {number|string} params.cod_cc
 * @param {number|string} params.cod_tipo_servicio
 * @param {number|string} params.cod_tipo_transporte
 * @param {number|string} params.entidad_id - entidad_id_cli
 * @param {number|string} [params.cod_puntoenlace_origen]
 * @param {number|string} [params.cod_puntoenlace_destino]
 * @param {number|string} [params.cod_commodity]
 * @param {number|string} [params.valor_libras]
 * @param {number|string} [params.valor_kilos]
 * @param {number|string} [params.valor_flete]
 * @param {number|string} [params.valor_dueagent]
 * @param {number|string} [params.valor_cwm]
 * @param {number|string} [params.valor_cw]
 * @param {number|string} [params.cod_equipo]
 * @param {number|string} [params.cod_tipo_carga]
 * @param {number|string} [params.cod_clasificacion_carga]
 * @param {number|string} [params.incoterm_id]
 * @param {number|string} [params.cod_tipo_pago]
 * @returns {Promise<Array>} Array of rubros: [{ COD_RUBRO, NOMBRE_RUBRO, SERVICIOS: [...] }]
 */
export const fetchCalcularTarifa = async (params) => {
  const queryParams = normalizeCalcularTarifaParams(params);
  const { data } = await api.get("/api/appweb/calcular-tarifa", { params: queryParams });
  return extractFromData(data);
};

/**
 * Hook for GET /api/appweb/calcular-tarifa.
 * Receives mandatory params (from embarque/coordinacion data) plus optional params
 * (typically derived from gastos criterios).
 *
 * The hook is disabled automatically if any mandatory param is missing.
 *
 * @param {Object} params - Query params (mandatory + optional)
 * @param {Object} [options] - Extra React Query options
 * @returns {UseQueryResult<Array>} Array of rubros with their services
 */
export { normalizeCalcularTarifaParams };

export function useCalcularTarifa(params = {}, options = {}) {
  const {
    cod_tarifaplantilla,
    cod_empresa,
    cod_cc,
    cod_tipo_servicio,
    cod_tipo_transporte,
    entidad_id,
    ...optionalParams
  } = params;

  // cod_tarifaplantilla is optional — the 5 fields from Coordinación are the
  // real mandatory ones.
  const mandatoryReady =
    !!cod_empresa &&
    !!cod_cc &&
    !!cod_tipo_servicio &&
    !!cod_tipo_transporte &&
    !!entidad_id;

  const enabled = mandatoryReady && (options.enabled !== false);

  // Build clean query params (exclude undefined/null optional values)
  const queryParams = { cod_empresa, cod_cc, cod_tipo_servicio, cod_tipo_transporte, entidad_id };
  if (cod_tarifaplantilla != null && cod_tarifaplantilla !== "") {
    queryParams.cod_tarifaplantilla = cod_tarifaplantilla;
  }
  Object.entries(optionalParams).forEach(([key, val]) => {
    if (val != null && val !== "") {
      queryParams[key] = val;
    }
  });

  return useQuery({
    queryKey: [
      "calcular-tarifa",
      cod_tarifaplantilla,
      cod_empresa,
      cod_cc,
      cod_tipo_servicio,
      cod_tipo_transporte,
      entidad_id,
      optionalParams,
    ],
    queryFn: () => fetchCalcularTarifa(queryParams),
    ...CACHE_DYNAMIC,
    ...options,
    enabled, // must come after ...options so mandatoryReady always gates the query
  });
}
