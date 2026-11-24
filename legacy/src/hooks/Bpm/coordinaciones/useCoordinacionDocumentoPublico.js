import { useQuery } from "@tanstack/react-query";
import useCustomMutation from "../../Fetch/useCustomMutation";
import api_no_auth_v2 from "../utils/apiPublic";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

const ENDPOINTS = {
  listar: "/clientes/api/v2/listar-coordinacion-documento",
  insertar: "/clientes/api/v2/insertar-coordinacion-documento",
  actualizar: "/clientes/api/v2/actualizar-coordinacion-documento",
  eliminar: "/clientes/api/v2/eliminar-coordinacion-documento",
};

function extraerBody(payload) {
  const { token_interaccion, version_app, ...rest } = payload || {};
  return rest;
}

/**
 * Hook público para listar los documentos de una coordinación.
 * Usa `api_no_auth_v2` (token_interaccion + version_app via headers).
 *
 * Misma forma de datos que `useCoordinacionDocumentos` privado.
 *
 * @param {{ embarque_id: string|number }} params - ID del embarque
 * @param {Object} options - Opciones adicionales de React Query
 */
export function useCoordinacionDocumentosPublico({ embarque_id }, options = {}) {
  return useQuery({
    queryKey: ["coordinacion-documentos-publico", String(embarque_id)],
    queryFn: async () => {
      const response = await api_no_auth_v2.get(ENDPOINTS.listar, {
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

/**
 * Hook público para insertar un documento relacionado a una coordinación.
 * Usa `api_no_auth_v2` (token_interaccion + version_app via headers).
 *
 * Mismo payload que `useCreateCoordinacionDocumento` privado:
 * { embarque_id, cod_tipo_documento, ubicacion, url_archivo, descripcion, estado_cod, documento_id_coord? }
 *
 * @example
 * const { mutateAsync } = useCreateCoordinacionDocumentoPublico();
 * await mutateAsync({
 *   embarque_id, cod_tipo_documento: 258, ubicacion: "coordinaciones",
 *   tipo_documento: "coordinaciones", url_archivo: ruta, descripcion: "", estado_cod: 1,
 *   token_interaccion,
 * });
 */
export function useCreateCoordinacionDocumentoPublico(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const body = extraerBody(payload);
      const response = await api_no_auth_v2.post(ENDPOINTS.insertar, body);
      return response?.data;
    },
    ...options,
  });
}

/**
 * Hook público para actualizar un documento de coordinación.
 * Usa `api_no_auth_v2` (token_interaccion + version_app via headers).
 *
 * Mismo payload que `useUpdateCoordinacionDocumento` privado:
 * { documento_id_coord, embarque_id, cod_tipo_documento, ubicacion, url_archivo, descripcion, estado_cod }
 */
export function useUpdateCoordinacionDocumentoPublico(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const body = extraerBody(payload);
      const response = await api_no_auth_v2.post(ENDPOINTS.actualizar, body);
      return response?.data;
    },
    ...options,
  });
}

/**
 * Hook público para eliminar un documento de coordinación.
 * Usa `api_no_auth_v2` (token_interaccion + version_app via headers).
 *
 * Mismo payload que `useDeleteCoordinacionDocumento` privado:
 * { documento_id_coord }
 */
export function useDeleteCoordinacionDocumentoPublico(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const body = extraerBody(payload);
      const response = await api_no_auth_v2.post(ENDPOINTS.eliminar, body);
      return response?.data;
    },
    ...options,
  });
}