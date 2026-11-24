import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener el listado de reason codes de documentos
 * @param {{ cod_empresa: string|number, cod_cc: string|number, tipoDocumentoId: string|number, reasonCodeId: string|number, estadoId: string|number }} params - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con reason codes de documentos
 */
export function useFetchDocumentosReasonCode(
  { cod_empresa, cod_cc, tipoDocumentoId, reasonCodeId, estadoId } = {},
  options = {}
) {
  return useQuery({
    queryKey: [
      "documentos-reason-code",
      cod_empresa || null,
      cod_cc || null,
      tipoDocumentoId || null,
      reasonCodeId || null,
      estadoId || null,
    ],
    queryFn: async () => {
      const params = {};
      if (cod_empresa) params.EMPRESA_ID = cod_empresa;
      if (cod_cc) params.CENCOS_ID = cod_cc;
      if (tipoDocumentoId) params.TIPO_DOCUMENTO_ID = tipoDocumentoId;
      if (reasonCodeId) params.REASON_CODE_ID = reasonCodeId;
      if (estadoId) params.ESTADO_ID = estadoId;
      const response = await api.get("/api/appweb/getLista_documentos_reason_code", { params });
      return extractResponseData(response).map((item) => ({
        value: item.reason_code_id,
        label: item.tipo_descripcion,
        documentoReasonCodeId: item.documento_reason_code_id,
        cod_empresa: item.empresa_id,
        cod_cc: item.cencos_id,
        tipoDocumentoId: item.tipo_documento_id,
        estadoId: item.estado_id,
      }));
    },
    ...CACHE_DYNAMIC,
    ...options,
  });
}
