import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener documentos de una coordinación
 * @param {{ embarque_id: string|number }} params - ID del embarque
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con documentos mapeados
 */
export function useCoordinacionDocumentos({ embarque_id }, options = {}) {
  return useQuery({
    queryKey: ["coordinacion-documentos", String(embarque_id)],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listar-coordinacion-documento", {
        params: { embarque_id },
      });
      const rawData = extractFromData(response.data);
      const mappedDocs = rawData.map((item) => ({
        documentoIdCoord: item.documento_id_coord || item.DOCUMENTO_ID_COORD,
        embarqueId: item.embarque_id || item.EMBARQUE_ID,
        codFile: item.cod_file || item.COD_FILE,
        embLegsId: item.emb_legs_id || item.EMB_LEGS_ID,
        tipoIdDocumento: item.tipo_id_documento || item.TIPO_ID_DOCUMENTO,
        tipoDescripcion: item.tipo_descripcion || item.TIPO_DESCRIPCION,
        urlArchivo: item.url_archivo || item.URL_ARCHIVO,
        descripcion: item.descripcion || item.DESCRIPCION,
        fechaCarga: item.fecha_carga || item.FECHA_CARGA,
        estadoId: item.estado_id || item.ESTADO_ID,
        estadoDescripcion: item.estado_descripcion || item.ESTADO_DESCRIPCION,
        usuarioIdCarga: item.usuario_id_carga || item.USUARIO_ID_CARGA,
        usuarioCrea: item.usuario_crea || item.USUARIO_CREA,
      }));
      return mappedDocs.filter((doc, index, self) => {
        const identity = doc.documentoIdCoord
          ? String(doc.documentoIdCoord)
          : `${doc.tipoIdDocumento}:${doc.urlArchivo}`;
        return index === self.findIndex((other) => {
          const otherIdentity = other.documentoIdCoord
            ? String(other.documentoIdCoord)
            : `${other.tipoIdDocumento}:${other.urlArchivo}`;
          return otherIdentity === identity;
        });
      });
    },
    enabled: !!embarque_id,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
