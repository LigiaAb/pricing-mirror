import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener los criterios asociados a una versión de detalle de cotización
 * params: { cod_detallecriterio, cod_cotizaciondetalle, cod_criterio } (opcionales)
 */
export function useFetchCotizacionDetalleCriterios(params = {}, options = {}) {
  return useQuery({
    queryKey: ["cotizacion-detalle-criterio", params],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-cotizacion-detalle-criterio", { params });
      const Data = extractFromData(response?.data) || [];

      return Data.map((item) => ({
        cod_detallecriterio: item.cod_detallecriterio || item.COD_DETALLECRITERIO,
        cod_cotizaciondetalle: item.cod_cotizaciondetalle || item.COD_COTIZACIONDETALLE,
        cod_criterio: item.cod_criterio || item.COD_CRITERIO,
        valor: item.valor || item.VALOR,
        datos: item,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
