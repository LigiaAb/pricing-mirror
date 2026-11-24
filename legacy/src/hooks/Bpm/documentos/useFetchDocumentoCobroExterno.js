import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener el listado de documentos de cobro externos (Oracle)
 * @param {{ cod_empresa_cropa: string|number, cod_cc_cropa: string|number, tipoDocumentoCropa: string, serie: string, fechaIni: Date|string, fechaFin: Date|string }} params
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con documentos de cobro externos
 */
export function useFetchDocumentoCobroExterno(
  { cod_empresa_cropa, cod_cc_cropa, tipoDocumentoCropa, serie, fechaIni, fechaFin } = {},
  options = {}
) {
  return useQuery({
    queryKey: [
      "documento-cobro-externo",
      cod_empresa_cropa || null,
      cod_cc_cropa || null,
      tipoDocumentoCropa || null,
      serie || null,
      fechaIni || null,
      fechaFin || null,
    ],
    queryFn: async () => {
      const params = {
        EMP_COD_CROPA: cod_empresa_cropa,
        CENCOS_CODCROPA: cod_cc_cropa,
      };
      if (tipoDocumentoCropa) params.TIPDOC_CODCROPA = tipoDocumentoCropa;
      if (serie) params.SERIE = serie;
      if (fechaIni) params.FECHA_INI = fechaIni;
      if (fechaFin) params.FECHA_FIN = fechaFin;

      const response = await api.get("/api/appweb/getDocumentoCobroExterno", { params });
      const lista = response?.data?.data?.lista_doc_cobro;

      return (Array.isArray(lista) ? lista : []).map((item) => ({
        id: `${item.EMP_CODIGO}-${item.TIPDOC_CODIGO}-${item.DOCCOB_SERIE}-${item.DOCCOB_NUMERO}`,
        empresa: item.EMP_NOMBRE,
        tipoDocumento: item.TIPDOC_DESCRIPCION,
        serie: item.DOCCOB_SERIE,
        numero: item.DOCCOB_NUMERO,
        fecha: item.DOCCOB_FECHA ? item.DOCCOB_FECHA.slice(0, 10) : item.DOCCOB_FECHA,
        cliente: item.CLI_NOMBRE,
        concepto: item.DOCCOB_CONCEPTO,
        moneda: item.MON_CODIGO,
        departamento: item.DEPORG_NOMBRE,
        estado: item.ESTDOC_DESCRIPCION,
        usuarioSolicita: item.USUERP_SOL,
      }));
    },
    enabled: !!cod_empresa_cropa && !!cod_cc_cropa,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
