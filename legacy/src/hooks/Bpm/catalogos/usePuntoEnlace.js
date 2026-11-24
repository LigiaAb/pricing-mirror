import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";
import { createDataMutationHook } from "../../Fetch/useFunctions";

/**
 * Hook para obtener lista de puntos de enlace
 * @param {Object} filters - Filtros opcionales (por ejemplo cod_puntoenlace, cod_pais, cod_tipo)
 * @param {Object} options - Opciones de react-query
 */
export function useFetchPuntoEnlace(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["puntos-enlace", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-punto_enlace", {
        params: filters,
      });

      return extractResponseData(response).map((item) => ({
        cod_puntoenlace: item.COD_PUNTOENLACE ?? item.cod_puntoenlace,
        codigo: item.CODIGO ?? item.codigo,
        nombre: item.NOMBRE ?? item.nombre,
        cod_pais: item.COD_PAIS ?? item.cod_pais,
        nombre_pais: item.NOMBRE_PAIS ?? item.nombre_pais,
        cod_tipo: item.COD_TIPO ?? item.cod_tipo,
        tipo_descripcion: item.TIPO_DESCRIPCION ?? item.tipo_descripcion,
        cod_estado: item.COD_ESTADO ?? item.cod_estado,
        estado_desc: item.ESTADO_DESC ?? item.estado_desc,
        value: item.COD_PUNTOENLACE ?? item.cod_puntoenlace,
        label: `${item.CODIGO ?? item.codigo ?? ""} - ${item.NOMBRE ?? item.nombre ?? ""}`,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}

export const useInsertarPuntoEnlace = createDataMutationHook(
  ["puntos-enlace"],
  "/api/appweb/insertar-punto_enlace",
  (res) => res,
);

export const useActualizarPuntoEnlace = createDataMutationHook(
  ["puntos-enlace"],
  "/api/appweb/actualizar-punto_enlace",
  (res) => res,
);

export const useEliminarPuntoEnlace = createDataMutationHook(
  ["puntos-enlace"],
  "/api/appweb/eliminar-punto_enlace",
  (res) => res,
);
