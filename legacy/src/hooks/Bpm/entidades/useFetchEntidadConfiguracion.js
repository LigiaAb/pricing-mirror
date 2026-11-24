import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener configuración de entidades
 * @param {Object} filters - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con configuración de entidad mapeada
 */
export function useFetchEntidadConfiguracion(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["entidad-configuracion", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-entidad-configuracion", {
        params: filters,
      });
      return extractResponseData(response).map((item) => ({
        entidadconfiguracionId:
          item.ENTIDADCONFIGURACION_ID ?? item.entidadconfiguracion_id,
        entidadId: item.ENTIDAD_ID ?? item.entidad_id,
        entidadNombre: item.ENTIDAD_NOMBRE ?? item.entidad_nombre,
        configuracionId: item.CONFIGURACION_ID ?? item.configuracion_id,
        configuracionDescripcion:
          item.CONFIGURACION_DESCRIPCION ?? item.configuracion_descripcion,
        fechaInicial:
          item.ENTIDADCONFIGURACION_FECHA_INICIAL ??
          item.entidadconfiguracion_fecha_inicial ??
          item.fecha_inicial,
        valor:
          item.ENTIDADCONFIGURACION_VALOR ??
          item.entidadconfiguracion_valor ??
          item.valor,
        codEstado: item.COD_ESTADO ?? item.cod_estado,
        estadoDesc: item.ESTADO_DESC ?? item.estado_desc,
        codPais: item.COD_PAIS ?? item.cod_pais,
        nombrePais: item.NOMBRE_PAIS ?? item.nombre_pais,
        raw: item,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
