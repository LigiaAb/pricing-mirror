import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener las series habilitadas para un tipo de documento y centro de costo
 * @param {{ documentoTipoCencosSerieId: string|number, cod_empresa: string|number, cod_cc: string|number, tipoDocumentoId: string|number, estadoId: string|number }} params - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con series para select
 */
export function useFetchSerieTipoDocumentoCentroCosto(
  { documentoTipoCencosSerieId, cod_empresa, cod_cc, tipoDocumentoId, estadoId } = {},
  options = {}
) {
  return useQuery({
    queryKey: [
      "serie-tipo-documento-centro-costo",
      documentoTipoCencosSerieId || null,
      cod_empresa || null,
      cod_cc || null,
      tipoDocumentoId || null,
      estadoId || null,
    ],
    queryFn: async () => {
      const params = { ESTADO_ID: 1 };
      if (documentoTipoCencosSerieId) params.DOCUMENTO_TIPO_CENCOS_SERIE_ID = documentoTipoCencosSerieId;
      if (cod_empresa) params.EMPRESA_ID = cod_empresa;
      if (cod_cc) params.CENCOS_ID = cod_cc;
      if (tipoDocumentoId) params.TIPO_DOCUMENTO_ID = tipoDocumentoId;
      if (estadoId) params.ESTADO_ID = estadoId;
      const response = await api.get("/api/appweb/getLista_serie_tipo_documento_centro_costo", { params });
      return extractResponseData(response).map((item) => ({
        value: item.documento_tipo_cencos_serie_id,
        label: item.serie,
        cod_empresa: item.empresa_id,
        cod_cc: item.cencos_id,
        tipoDocumentoId: item.tipo_documento_id,
        estadoId: item.estado_id,
      }));
    },
    enabled: !!cod_empresa && !!cod_cc && !!tipoDocumentoId,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
