import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, extractFromData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener lista de correlativos de guías
 * @param {Object} filters - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query (enabled, etc.)
 * @returns {UseQueryResult} Query result con correlativos mapeados
 */
export function useFetchCorrelativoGuias(filters = {}, options = {}) {
  // Si filters contiene 'enabled', extraerlo como opción
  const { enabled: filterEnabled, ...actualFilters } = filters;
  const finalEnabled = options.enabled ?? filterEnabled;

  return useQuery({
    queryKey: ["correlativo-guias", actualFilters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listar-correlativo-guias", {
        params: actualFilters,
      });
      return extractResponseData(response).map((r) => ({
        correlativoId: r.CORRELATIVO_ID ?? r.correlativo_id,
        correlativoTabla: r.CORRELATIVO_TABLA ?? r.correlativo_tabla,
        correlativoCodigo: r.CORRELATIVO_CODIGO ?? r.correlativo_codigo,
        correlativoActual: r.CORRELATIVO_ACTUAL ?? r.correlativo_actual ?? null,
        correlativoInicial: r.CORRELATIVO_INICIAL ?? r.correlativo_inicial,
        correlativoFinal: r.CORRELATIVO_FINAL ?? r.correlativo_final,
        correlativoFecha: r.CORRELATIVO_FECHA ?? r.correlativo_fecha,
        correlativoSerie: r.CORRELATIVO_SERIE ?? r.correlativo_serie,
        centroCostoId: r.CENCOS_ID ?? r.cencos_id ?? r.COD_CC ?? r.cod_cc,
        empresaId: r.EMPRESA_ID ?? r.empresa_id,
        empresaNombre: r.EMPRESA_NOMBRE ?? r.empresa_nombre ?? r.nombre_emp,
        nombreEmp: r.EMPRESA_NOMBRE ?? r.empresa_nombre ?? r.nombre_emp,
        centroCostoNombre: r.CENCOD_NOMBRE ?? r.cencod_nombre ?? r.nombre_cc,
        cencodNombre: r.CENCOD_NOMBRE ?? r.cencod_nombre ?? r.nombre_cc,
        tipoId: r.TIPO_ID ?? r.tipo_id,
        tipoDescripcion: r.TIPO_DESCRIPCION ?? r.tipo_descripcion,
        estadoId: r.ESTADO_ID ?? r.estado_id,
        estadoDescripcion: r.ESTADO_DESCRIPCION ?? r.estado_descripcion,
        correlativoFechaVencimiento:
          r.CORRELATIVO_FECHA_VENCIMIENTO ?? r.correlativo_fecha_vencimiento,
        entidadIdLineaAerea:
          r.ENTIDAD_ID_LINEA_AEREA ?? r.entidad_id_linea_aerea,
        entidadNombre: r.ENTIDAD_NOMBRE ?? r.entidad_nombre,
        replicarAnual: r.REPLICAR_ANUAL ?? r.replicar_anual,
        cantidadSalto: r.CANTIDAD_SALTO ?? r.cantidad_salto,
        raw: r,
      }));
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    ...(finalEnabled !== undefined && { enabled: finalEnabled }),
    ...options,
  });
}

/**
 * Hook para obtener detalle de un correlativo de guías
 * @param {{ correlativo_id: string|number }} params - ID del correlativo
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con detalles del correlativo
 */
export function useFetchDetalleCorrelativoGuias(
  { correlativo_id } = {},
  options = {}
) {
  return useQuery({
    queryKey: ["detalle-correlativo-guias", correlativo_id || null],
    queryFn: async () => {
      try {
        const response = await api.get(
          "/api/appweb/listar-detalle-correlativo-guias",
          {
            params: { correlativo_id },
          }
        );
        const realData = extractFromData(response?.data);
        return realData.map((item) => ({
          detCorrelativoGuiaId:
            item.DET_CORRELATIVO_GUIA_ID ?? item.det_correlativo_guia_id,
          correlativoId: item.CORRELATIVO_ID ?? item.correlativo_id,
          correlativoGuia: item.CORRELATIVO_GUIA ?? item.correlativo_guia,
          estadoId: item.ESTADO_ID ?? item.estado_id,
          estadoDescripcion: item.ESTADO_DESCRIPCION ?? item.estado_descripcion,
          fechaRegistro: item.FECHA_REGISTRO ?? item.fecha_registro,
          guiaAsignadaId: item.GUIA_ASIGNADA_ID ?? item.guia_asignada_id,
          raw: item,
        }));
      } catch (e) {
        console.error("Error fetching detalle-correlativo-guias", {
          correlativo_id,
          error: e,
        });
        return [];
      }
    },
    enabled: !!correlativo_id,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
