import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

/**
 * Hook para obtener relaciones entre entidades
 *
 * Filters disponibles:
 * - entidad_id (number) - opcional
 * - cod_estado  (number) - opcional
 *
 * Respuesta mapeada a camelCase.
 *
 * @param {Object} filters
 * @param {Object} options - opciones para react-query
 * @returns {UseQueryResult<Array>} lista de relaciones de entidad
 */
export function useFetchEntidadRelaciones(filters = {}, options = {}) {
  const token = getAuthToken();

  return useQuery({
    queryKey: ["entidad-relaciones", filters, token],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-entidad-relacion", { params: filters });
      const list = extractResponseData(response);
      return list.map((it) => ({
        cod_entidadrelacion: it.COD_ENTIDADRELACION ?? it.cod_entidadrelacion,
        entidad_id_1: it.ENTIDAD_ID_1 ?? it.entidad_id_1,
        cod_tipo_e1: it.COD_TIPO_E1 ?? it.cod_tipo_e1,
        tipo_descripcion_e1: it.TIPO_DESCRIPCION_E1 ?? it.tipo_descripcion_e1,
        entidad_nombre_1: it.ENTIDAD_NOMBRE_1 ?? it.entidad_nombre_1,
        entidad_id_2: it.ENTIDAD_ID_2 ?? it.entidad_id_2,
        entidad_nombre_2: it.ENTIDAD_NOMBRE_2 ?? it.entidad_nombre_2,
        cod_tipo_e2: it.COD_TIPO_E2 ?? it.cod_tipo_e2,
        tipo_descripcion_e2: it.TIPO_DESCRIPCION_E2 ?? it.tipo_descripcion_e2,
        fecha_inicial: it.FECHA_INICIAL ?? it.fecha_inicial,
        cod_tipo: it.COD_TIPO ?? it.cod_tipo,
        cod_estado: it.COD_ESTADO ?? it.cod_estado,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
