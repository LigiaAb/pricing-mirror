import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de rubros
 * @param {Object} filters - Filtros opcionales (por ejemplo cod_estado o cod_rubro)
 * @returns {UseQueryResult} Query result con rubros
 */
export function useFetchRubros(filters = {}) {
  return useQuery({
    queryKey: ["rubros", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-rubros", {
        params: filters,
      });
      return extractResponseData(response).map((rubro) => ({
        cod_rubro: rubro.COD_RUBRO || rubro.cod_rubro,
        nombre: rubro.NOMBRE || rubro.nombre,
        cod_estado: rubro.COD_ESTADO || rubro.cod_estado,
        fecha_inicio: rubro.FECHA_INICIO || rubro.fecha_inicio,
        fecha_final: rubro.FECHA_FINAL || rubro.fecha_final,
      }));
    },
    ...CACHE_SEMI_STATIC,
  });
}
