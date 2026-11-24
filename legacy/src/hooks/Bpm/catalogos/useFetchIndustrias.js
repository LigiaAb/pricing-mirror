import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook para obtener la lista de industrias
 *
 * Endpoint: GET /api/appweb/lista-industria
 *
 * @param {Object} filters - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Resultado con industrias mapeadas
 */
export function useFetchIndustrias(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["industrias", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-industria");
      return extractResponseData(response).map((i) => ({
        cod_industria: i.COD_INDUSTRIA ?? i.cod_industria,
        nom_industria_es: i.NOM_INDUSTRIA_ES ?? i.nom_industria_es,
        value: i.COD_INDUSTRIA ?? i.cod_industria,
        label: i.NOM_INDUSTRIA_ES ?? i.nom_industria_es,
      }));
    },
    ...CACHE_STATIC,
    ...options,
  });
}
