import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener los rubros asociados a un detalle de cotización
 * params: { cod_cotizaciondetalle } (opcional)
 * endpoint: GET /api/appweb/lista-cotizacion-detalle-rubro
 */
export function useFetchCotizacionDetalleRubros(params = {}, options = {}) {
  return useQuery({
    queryKey: ["cotizacion-detalle-rubro", params],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-cotizacion-detalle-rubro", { params });
      const Data = extractFromData(response?.data) || [];

      return Data.map((item) => ({
        cod_detallerubro: item.cod_detallerubro || item.COD_DETALLERUBRO,
        cod_cotizaciondetalle: item.cod_cotizaciondetalle || item.COD_COTIZACIONDETALLE,
        cod_rubro: item.cod_rubro || item.COD_RUBRO,
        gruporubro_nombre: item.gruporubro_nombre || item.GRUPORUBRO_NOMBRE,
        costo_rubro: item.costo_rubro || item.COSTO_RUBRO,
        costo_grupo: item.costo_grupo || item.COSTO_GRUPO,
        venta_rubro: item.venta_rubro || item.VENTA_RUBRO,
        venta_grupo: item.venta_grupo || item.VENTA_GRUPO,
        cod_moneda_costo: item.cod_moneda_costo || item.COD_MONEDA_COSTO,
        cod_moneda_venta: item.cod_moneda_venta || item.COD_MONEDA_VENTA,
        cod_servicio: item.cod_servicio || item.COD_SERVICIO,
        entidad_id: item.entidad_id || item.ENTIDAD_ID,
        clasificacion: item.clasificacion || item.CLASIFICACION,
        cod_tipo_pago: item.cod_tipo_pago || item.COD_TIPO_PAGO,
        cod_tipo_facturacion: item.cod_tipo_facturacion || item.COD_TIPO_FACTURACION,
        cod_tipo_calculo: item.cod_tipo_calculo || item.COD_TIPO_CALCULO,
        cod_metodo: item.cod_metodo || item.COD_METODO,
        rate_costo: item.rate_costo || item.RATE_COSTO,
        rate_venta: item.rate_venta || item.RATE_VENTA,
        detalle: item.detalle || item.DETALLE,
        datos: item,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
