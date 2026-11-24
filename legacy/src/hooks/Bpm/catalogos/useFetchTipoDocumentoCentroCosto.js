import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener los tipos de documento habilitados para una empresa y centro de costo
 * @param {{ cod_empresa: string|number, cod_cc: string|number }} params - Empresa y centro de costo elegidos
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con tipos de documento para select
 */
export function useFetchTipoDocumentoCentroCosto({ cod_empresa, cod_cc } = {}, options = {}) {
  return useQuery({
    queryKey: ["tipo-documento-centro-costo", cod_empresa || null, cod_cc || null],
    queryFn: async () => {
      const params = { ESTADO_ID: 1 };
      if (cod_empresa) params.EMPRESA_ID = cod_empresa;
      if (cod_cc) params.CENCOS_ID = cod_cc;
      const response = await api.get("/api/appweb/getLista_tipo_documentos_centro_costo", { params });
      return extractResponseData(response).map((item) => ({
        value: item.tipo_documento_id,
        label: item.tipo_descripcion,
        documentoTipoCencosId: item.documento_tipo_cencos_id,
        cod_empresa: item.empresa_id,
        cod_cc: item.cencos_id,
        estadoId: item.estado_id,
        codCropa: item.nomenclatura,
      }));
    },
    enabled: !!cod_empresa && !!cod_cc,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
