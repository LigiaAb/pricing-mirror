import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para listar documentos de una cotización
 * @param {{ cod_cotizacion_cabecera: number|string }} params
 * @param {Object} options - Opciones adicionales para React Query
 * @returns {UseQueryResult<Array>} Lista de documentos mapeados
 *
 * API: GET /api/appweb/lista-cotizacion-documentos?cod_cotizacion_cabecera=...
 */
export function useCotizacionDocumentos({ cod_cotizacion_cabecera } = {}, options = {}) {
  return useQuery({
    queryKey: ["cotizacion-documentos", cod_cotizacion_cabecera],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-cotizacion-documentos", {
        params: { cod_cotizacion_cabecera },
      });

      const raw = extractFromData(response?.data) || [];

      return raw.map((item) => ({
        cotizacionDocumentoId: item.cotizaciondocumento_id || item.COTIZACIONDOCUMENTO_ID || item.COTIZACIONDOCUMENTOID,
        cotizacionCabeceraId: item.cod_cotizacion_cabecera || item.COTIZACIONCABECERA_ID || item.COTIZACIONCABECERAID || item.COTIZACIONCABECERA_ID,
        tipoDocumentoId: item.tipo_documento_id || item.TIPO_DOCUMENTO_ID || item.cod_tip_doc || item.COD_TIP_DOC,
        tipoDescripcion: item.tipo_descripcion || item.TIPO_DESCRIPCION || item.TIPO_DESCRIPCION,
        fecha: item.cotizacion_fecha || item.COTIZACION_FECHA || item.fecha_cotizacion || item.FECHA_COTIZACION,
        urlDocumento: item.cotizacion_url_documento || item.COTIZACION_URL_DOCUMENTO || item.url_documento || item.URL_DOCUMENTO,
        usuarioIdCarga: item.usuario_id_carga || item.USUARIO_ID_CARGA,
        usuarioCorreo: item.usuario_correo || item.USUARIO_CORREO || item.usuario_correo || item.USUARIO_CORREO,
        estadoId: item.coordinacion_estado_id || item.COORDINACION_ESTADO_ID || item.cod_estado || item.COD_ESTADO,
        raw: item,
      }));
    },
    enabled: !!cod_cotizacion_cabecera,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
