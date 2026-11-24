import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { CACHE_DYNAMIC } from "../utils";

export const fetchUltimaVersionCoordinacionGastos = async (embarque_id) => {
  const response = await api.get("/api/appweb/obtener-ultima-version-coordinacion-gastos", {
    params: { EMBARQUE_ID: embarque_id },
  });
  const data = response?.data || {};
  const d = data?.data || {};
  let embarque_version = null;
  if (d?.EMBARQUE_VERSION !== undefined) {
    embarque_version = Number(d.EMBARQUE_VERSION);
  } else if (d?.embarque_version !== undefined) {
    embarque_version = Number(d.embarque_version);
  }
  return { ...data, embarque_version };
};

/**
 * Hook para obtener la última versión de coordinación de gastos de un embarque
 * @param {string|number} embarque_id - ID del embarque (opcional)
 * @param {Object} options - Opciones adicionales para React Query
 * @returns {UseQueryResult} Resultado de la query con la data tal cual la devuelve la API
 */
export function useObtenerUltimaVersionCoordinacionGastos(embarque_id, options = {}) {
  return useQuery({
    queryKey: ["ultima-version-coordinacion-gastos", embarque_id],
    queryFn: () => fetchUltimaVersionCoordinacionGastos(embarque_id),
    enabled: !!embarque_id,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
