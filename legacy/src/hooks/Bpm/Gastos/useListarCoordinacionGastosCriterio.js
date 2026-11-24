import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

export const fetchCoordinacionGastosCriterio = async (embarque_id, embarque_version) => {
  const params = { EMBARQUE_ID: embarque_id };
  if (embarque_version !== undefined && embarque_version !== null) {
    params.EMBARQUE_VERSION = embarque_version;
  }
  const { data } = await api.get("/api/appweb/listar-coordinacion-gastos-criterio", {
    params,
  });

  const realData = extractFromData(data);
  
  return realData.map((item) => ({
    embGastoCriterioId: item.EMBGASTOCRITERIO_ID ?? item.embGastoCriterioId ?? item.embgastocriterio_id,
    embarqueId: item.EMBARQUE_ID ?? item.embarqueId ?? item.embarque_id,
    embarqueVersion: item.EMBARQUE_VERSION ?? item.embarqueVersion ?? item.embarque_version,
    criterioId: item.CRITERIO_ID ?? item.criterioId ?? item.criterio_id,
    criterioCampo: item.CRITERIO_CAMPO ?? item.criterioCampo ?? item.criterio_campo,
    valor: item.VALOR ?? item.valor,
  }));
};

/**
 * Hook para listar criterios de gastos de una coordinación (embarque)
 * @param {string|number} embarque_id - ID del embarque (opcional)
 * @param {string|number} embarque_version - Versión del embarque (opcional)
 * @param {Object} options - Opciones adicionales para React Query
 * @returns {UseQueryResult} Query result con criterios mapeados
 */
export function useListarCoordinacionGastosCriterio(embarque_id, embarque_version, options = {}) {
  return useQuery({
    queryKey: ["listar-coordinacion-gastos-criterio", embarque_id, embarque_version],
    queryFn: () => fetchCoordinacionGastosCriterio(embarque_id, embarque_version),
    enabled: !!embarque_id,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
