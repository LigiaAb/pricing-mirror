import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de identificaciones de punto de enlace
 * @param {Object} filters - Filtros opcionales (por ejemplo cod_puntoenlace)
 * @param {Object} options - Opciones de react-query
 */
export function useFetchPuntoEnlaceIdentificaciones(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["puntoenlace-identificaciones", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-identificacion-punto_enlace", {
        params: filters,
      });

      return extractResponseData(response).map((item) => ({
        cod_puntoenlace_identificacion: item.COD_PUNTOENLACE_IDENTIFICACION ?? item.cod_puntoenlace_identificacion,
        codigo: item.CODIGO ?? item.codigo,
        cod_puntoenlace: item.COD_PUNTOENLACE ?? item.cod_puntoenlace,
        cod_tipo: item.COD_TIPO ?? item.cod_tipo,
        tipo_descripcion: item.TIPO_DESCRIPCION ?? item.tipo_descripcion,
        cod_estado: item.COD_ESTADO ?? item.cod_estado,
        estado_desc: item.ESTADO_DESC ?? item.estado_desc,
        id: item.COD_PUNTOENLACE_IDENTIFICACION ?? item.cod_puntoenlace_identificacion,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
