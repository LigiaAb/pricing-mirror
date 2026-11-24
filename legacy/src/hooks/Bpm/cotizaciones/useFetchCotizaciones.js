import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de cotizaciones (cabecera)
 * @param {{ cod_empresa?: string|number, cod_cc?: string|number }} params - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con cotizaciones mapeadas
 */
export function useFetchCotizaciones(params = {}, options = {}) {
  return useQuery({
    queryKey: ["cotizaciones-cabecera", params],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-cotizacion-cabecera", {
        params,
      });

      const Data = extractFromData(response?.data);

      const mappedData = Data.map((item) => ({
        cod_cotizacion_cabecera: item.cod_cotizacion_cabecera,
        cod_empresa: item.cod_empresa,
        cod_cc: item.cod_cc,
        fecha_creacion: item.fecha_creacion,
        fecha_aprobacion: item.fecha_aprobacion,
        entidad_id: item.entidad_id,
        entidadcontacto_id: item.entidadcontacto_id,
        cod_tipo_servicio: item.cod_tipo_servicio,
        cod_tipo_transporte: item.cod_tipo_transporte,
        cod_tipo_carga: item.cod_tipo_carga,
        cod_clasificacion_carga: item.cod_clasificacion_carga,
        incoterm_id: item.incoterm_id,
        cod_tipo_pago: item.cod_tipo_pago,
        cod_puntoenlace_origen: item.cod_puntoenlace_origen,
        cod_pais_origen: item.cod_pais_origen,
        cod_tipo_puntoenlace_origen: item.cod_tipo_puntoenlace_origen,
        cod_puntoenlace_destino: item.cod_puntoenlace_destino,
        cod_pais_destino: item.cod_pais_destino,
        cod_tipo_puntoenlace_destino: item.cod_tipo_puntoenlace_destino,
        cod_estado: item.cod_estado,
      }));

      return mappedData;
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
