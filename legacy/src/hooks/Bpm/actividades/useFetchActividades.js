import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener lista de actividades filtradas.
 * Ejemplo de filtros: { cod_asesor, cod_tipo, cod_cliente, cod_actividad, vencidas }
 * @param {Object} filters
 * @param {Object} options - opciones de react-query
 */
export function useFetchActividades(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["actividades", filters],
    queryFn: async () => {
      const resp = await api.get("/api/appweb/lista-actividades", { params: filters });
      return extractResponseData(resp);
    },
    ...CACHE_DYNAMIC,
    placeholderData: undefined,
    ...options,
  });
}
