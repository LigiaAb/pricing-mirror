import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener lista de guías asignadas a coordinaciones
 * @param {Object} filters - Filtros opcionales. Los parámetros admitidos son:
 *   - embarque_id
 *   - guia_asignada_id
 *   - estado_id
 *   - tipo_id_guia
 *   - entidad_id_currier
 *   (cualquiera puede omitirse si no se desea filtrar por él)
 * @param {Object} options - Opciones adicionales de React Query (enabled, etc.)
 * @returns {UseQueryResult} Query result con guías de coordinación mapeadas
 */
export function useFetchGuiasCoordinacion(filters = {}, options = {}) {
  // Si filters contiene 'enabled', extraerlo como opción
  const { enabled: filterEnabled, ...actualFilters } = filters;
  const finalEnabled = options.enabled ?? filterEnabled;

  // Normalizar claves para el endpoint, en especial embarqueId -> embarque_id
  const normalizedFilters = {
    ...actualFilters,
    ...(actualFilters.embarqueId !== undefined && { embarque_id: actualFilters.embarqueId }),
  };
  delete normalizedFilters.embarqueId;

  return useQuery({
    queryKey: ["guias-coordinacion", normalizedFilters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listar-guia-coordinacion", {
        params: normalizedFilters,
      });
      return extractResponseData(response).map((r) => ({
        guiaAsignadaId: r.GUIA_ASIGNADA_ID ?? r.guia_asignada_id,
        detCorrelativoGuiaId: r.DET_CORRELATIVO_GUIA_ID ?? r.det_correlativo_guia_id,
        embarqueId: r.EMBARQUE_ID ?? r.embarque_id,
        idFile: r.ID_FILE ?? r.id_file,
        correlativoGuia: r.CORRELATIVO_GUIA ?? r.correlativo_guia,
        entidadIdCurrier: r.ENTIDAD_ID_CURRIER ?? r.entidad_id_currier,
        entidadIdCliente: r.ENTIDAD_ID_CLIENTE ?? r.entidad_id_cliente,
        fechaAsigna: r.FECHA_ASIGNA ?? r.fecha_asigna,
        fechaUtilizada: r.FECHA_UTILIZADA ?? r.fecha_utilizada,
        usuarioIdAsigna: r.USUARIO_ID_ASIGNA ?? r.usuario_id_asigna,
        estadoId: r.ESTADO_ID ?? r.estado_id,
        tipoIdGuia: r.TIPO_ID_GUIA ?? r.tipo_id_guia,
        correlativoGuiaMaster: r.CORRELATIVO_GUIA_MASTER ?? r.correlativo_guia_master,
        fechaAtd: r.FECHA_ATD ?? r.fecha_atd,
        raw: r,
      }));
    },
    ...CACHE_DYNAMIC,
    ...(finalEnabled !== undefined && { enabled: finalEnabled }),
    ...options,
  });
}
