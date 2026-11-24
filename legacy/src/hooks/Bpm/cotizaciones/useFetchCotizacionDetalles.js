import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener detalles (versiones) de una cotización
 * params: { cod_cotizacion_cabecera, cod_estado } (cod_estado opcional)
 */
export function useFetchCotizacionDetalles(params = {}, options = {}) {
  return useQuery({
    queryKey: ["cotizacion-detalle", params],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-cotizacion-detalle", { params });
      const Data = extractFromData(response?.data) || [];

      const mapped = Data.map((item) => ({
        cod_cotizaciondetalle:
          item.cod_cotizaciondetalle || item.COD_COTIZACIONDETALLE,
        cod_cotizacion_cabecera:
          item.cod_cotizacion_cabecera || item.COD_COTIZACION_CABECERA,
        version: item.version || item.VERSION,
        fecha_creacion: item.fecha_creacion || item.FECHA_CREACION,
        fecha_vencimiento: item.fecha_vencimiento || item.FECHA_VENCIMIENTO,
        total: item.total || item.TOTAL || item.monto || item.MONTO || 0,
        cod_estado: item.cod_estado || item.COD_ESTADO,
        datos: item,
      }));

      return mapped;
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
