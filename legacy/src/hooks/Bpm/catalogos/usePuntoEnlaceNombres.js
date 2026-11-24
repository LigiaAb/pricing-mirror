import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de nombres de punto de enlace
 * @param {Object} filters - Filtros opcionales (por ejemplo cod_puntoenlace)
 * @param {Object} options - Opciones de react-query
 */
export function useFetchPuntoEnlaceNombres(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["puntoenlace-nombres", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-nombre-punto_enlace", {
        params: filters,
      });

      return extractResponseData(response).map((item) => ({
        cod_puntoenlace_nombre: item.COD_PUNTOENLACE_NOMBRE ?? item.cod_puntoenlace_nombre,
        nombre: item.NOMBRE ?? item.nombre,
        cod_puntoenlace: item.COD_PUNTOENLACE ?? item.cod_puntoenlace,
        cod_estado: item.COD_ESTADO ?? item.cod_estado,
        estado_desc: item.ESTADO_DESC ?? item.estado_desc,
        value: item.COD_PUNTOENLACE_NOMBRE ?? item.cod_puntoenlace_nombre,
        label: item.NOMBRE ?? item.nombre,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
