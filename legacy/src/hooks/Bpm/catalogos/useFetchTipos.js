import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de tipos
 * @param {Object} filters - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con tipos mapeados
 */
export function useFetchTipos(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["lista-tipo", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-tipo", {
        params: filters,
      });
      return extractResponseData(response).map((t) => ({
        codTipo: t.cod_tipo,
        nomTipo: t.nom_tipo,
        tipoTabla: t.tipo_tabla,
        codEstado: t.cod_estado,
        estadoDesc: t.estado_desc,
        codTipoDato: t.cod_tipo_dato,
        nomenclatura: t.nomenclatura,
        value: t.cod_tipo,
        label: t.nom_tipo,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
