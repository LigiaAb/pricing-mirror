import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de estados
 * @param {Object} filters - Filtros opcionales
 * @returns {UseQueryResult} Query result con estados mapeados
 */
export function useFetchEstados(filters = {}) {
  return useQuery({
    queryKey: ["estados", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listaestados", {
        params: filters,
      });
      return extractResponseData(response).map((estado) => ({
        cod_estado: estado.cod_estado,
        estado_desc: estado.estado_desc,
        cod_tipo: estado.cod_tipo,
        nomb_tipo: estado.nom_tipo,
      }));
    },
    ...CACHE_SEMI_STATIC,
  });
}
