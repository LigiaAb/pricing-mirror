import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de servicios
 * @param {Object} filters - Filtros opcionales (por ejemplo servicio_interno, cod_estado)
 * @returns {UseQueryResult} Query result con servicios
 */
export function useFetchServicios(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["servicios", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-servicios", {
        params: filters,
      });
      return extractResponseData(response).map((servicio) => ({
        value: servicio.COD_SERVICIO ?? servicio.cod_servicio,
        label: servicio.NOMBRE ?? servicio.nombre ?? servicio.DESCRIPCION ?? servicio.descripcion,
        cod_servicio: servicio.COD_SERVICIO ?? servicio.cod_servicio,
        nombre: servicio.NOMBRE ?? servicio.nombre,
        siglas: servicio.SIGLAS ?? servicio.siglas,
        cod_rubro: servicio.COD_RUBRO ?? servicio.cod_rubro,
        cod_tipo_servicio: servicio.COD_TIPO_SERVICIO ?? servicio.cod_tipo_servicio,
        cod_tipo_transporte: servicio.COD_TIPO_TRANSPORTE ?? servicio.cod_tipo_transporte,
        entidad_id: servicio.ENTIDAD_ID ?? servicio.entidad_id,
        cod_empresa: servicio.COD_EMPRESA ?? servicio.cod_empresa,
        cod_cc: servicio.COD_CC ?? servicio.cod_cc,
        cod_tipo_calculo: servicio.COD_TIPO_CALCULO ?? servicio.cod_tipo_calculo,
        cod_tipo_aplicacion: servicio.COD_TIPO_APLICACION ?? servicio.cod_tipo_aplicacion,
        cod_tipo_carga: servicio.COD_TIPO_CARGA ?? servicio.cod_tipo_carga,
        cod_clasificacion_carga: servicio.COD_CLASIFICACION_CARGA ?? servicio.cod_clasificacion_carga,
        incoterm_id: servicio.INCOTERM_ID ?? servicio.incoterm_id,
        cod_tipo_pago: servicio.COD_TIPO_PAGO ?? servicio.cod_tipo_pago,
        cod_estado: servicio.COD_ESTADO ?? servicio.cod_estado,
        servicio_interno: servicio.SERVICIO_INTERNO ?? servicio.servicio_interno,
        clasificacion: servicio.CLASIFICACION ?? servicio.clasificacion,
        servicio_especial: servicio.SERVICIO_ESPECIAL ?? servicio.servicio_especial,
        categoria_transporte: servicio.CATEGORIA_TRANSPORTE ?? servicio.categoria_transporte,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
