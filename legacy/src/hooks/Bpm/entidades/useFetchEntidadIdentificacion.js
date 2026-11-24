import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { CACHE_SEMI_STATIC } from "../utils";

const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

/**
 * Hook para obtener lista de identificaciones de entidad
 * @param {Object} params
 * @param {number} params.cod_tipo - Código de tipo de entidad (REQUIRED)
 * @param {number} [params.entidadidentificacion_id]
 * @param {number} [params.entidad_id]
 * @param {number} [params.nopagina]
 * @param {number} [params.cod_identificacion]
 * @param {Object} options - Opciones de react-query
 */
export function useFetchEntidadIdentificacion(params = {}, options = {}) {
  const { cod_tipo, entidadidentificacion_id, entidad_id, nopagina, cod_identificacion, cod_estado } = params;

  const token = getAuthToken();

  return useQuery({
    queryKey: ["entidad-identificacion", params, token],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-entidad-identificacion", {
        params: {
          cod_tipo,
          ...(entidadidentificacion_id && { entidadidentificacion_id }),
          ...(entidad_id && { entidad_id }),
          ...(nopagina && { nopagina }),
          ...(cod_identificacion && { cod_identificacion }),
          ...(cod_estado != null && { cod_estado }),
        },
      });

      const responseData = response?.data?.data || {};

      return {
        total_paginas: responseData.total_paginas || 0,
        total_registros: responseData.total_registros || 0,
        data: (responseData.data || []).map((item) => ({
          entidadidentificacion_id: item.entidadidentificacion_id || item.ENTIDADIDENTIFICACION_ID,
          entidad_id: item.entidad_id || item.ENTIDAD_ID,
          entidad_nombre: item.entidad_nombre || item.ENTIDAD_NOMBRE,
          cod_identificacion: item.cod_identificacion || item.COD_IDENTIFICACION,
          nom_identificacion: item.nom_identificacion || item.NOM_IDENTIFICACION,
          entidadidentificacion_numero:
            item.entidadidentificacion_numero ||
            item.entidadidentificacio_numero ||
            item.entidadidentificacio_num ||
            item.identificacion_numero ||
            item.ENTIDADIDENTIFICACIO_NUMERO ||
            item.ENTIDADIDENTIFICACION_NUMERO,
          cod_estado: item.cod_estado || item.COD_ESTADO,
          estado_desc: item.estado_desc || item.ESTADO_DESC,
          entidadidentificacion_fecha_inicio:
            item.entidadidentificacion_fecha_inicio || item.ENTIDADIDENTIFICACION_FECHA_INICIO,
          entidadidentificacion_fecha_fin:
            item.entidadidentificacion_fecha_fin || item.ENTIDADIDENTIFICACION_FECHA_FIN,
          entidadidentificacion_ruta: item.entidadidentificacion_ruta || item.ENTIDADIDENTIFICACION_RUTA,
        })),
      };
    },
    enabled: Boolean(cod_tipo),
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
