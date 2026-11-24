import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener municipios filtrando por departamento
 *
 * Endpoint: GET /api/appweb/lista-municipios
 * Parámetros opcionales:
 *   cod_depto - Numérico 1-5: código del departamento cuyos municipios se desean recuperar
 *
 * @param {Object} filters - Filtros opcionales (ej: { cod_depto: 1401 })
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Resultado de la consulta con municipios mapeados
 */
export function useFetchMunicipios(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["municipios", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-municipios", {
        params: filters,
      });
      return extractResponseData(response).map((m) => ({
        cod_muni: m.COD_MUNI ?? m.cod_muni,
        cod_depto: m.COD_DEPTO ?? m.cod_depto,
        nombre_muni: m.NOMBRE_MUNI ?? m.nombre_muni,
        cod_estado: m.COD_ESTADO ?? m.cod_estado,
        estado_desc: m.ESTADO_DESC ?? m.estado_desc,
        value: m.COD_MUNI ?? m.cod_muni,
        label: m.NOMBRE_MUNI ?? m.nombre_muni,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
