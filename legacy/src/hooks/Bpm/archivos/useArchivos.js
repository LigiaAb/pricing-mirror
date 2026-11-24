import useCustomMutation from "../../Fetch/useCustomMutation";
import { api } from "../../../api";

/**
 * Hook para recuperar/descargar archivos del servidor
 * @param {Object} options - Opciones adicionales para la mutación
 * @returns {UseMutationResult} Mutation hook que retorna un Blob
 *
 * @payload { ruta_archivo: string } - Ruta del archivo a recuperar (max 150 chars)
 *
 * @example
 * const { mutateAsync } = useRecuperarArchivo();
 * const blob = await mutateAsync({ ruta_archivo: '/cropa/admo/recursos/file.pdf' });
 *
 * // Visualizar o descargar
 * const url = URL.createObjectURL(blob);
 * window.open(url);
 */
export function useRecuperarArchivo(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/api/appweb/recuperar-archivo", payload, {
        responseType: "blob",
      });
      return response.data;
    },
    ...options,
  });
}

/**
 * Construye FormData desde un objeto o retorna FormData existente
 * @param {Object|FormData} payload - Datos a convertir
 * @returns {FormData} FormData listo para enviar
 */
function buildFormData(payload) {
  if (payload instanceof FormData) {
    const hasCodFileKey = Array.from(payload.keys()).some((key) =>
      ["cod_file", "codFile", "COD_FILE"].includes(key)
    );

    if (!hasCodFileKey && payload.get("tipo_documento") === "coordinaciones") {
      payload.append("cod_file", "");
    }

    return payload;
  }

  const formData = new FormData();
  if (payload && typeof payload === "object") {
    const normalizedPayload = { ...payload };

    if (normalizedPayload.tipo_documento === "coordinaciones") {
      normalizedPayload.cod_file =
        normalizedPayload.cod_file ??
        normalizedPayload.codFile ??
        normalizedPayload.COD_FILE ??
        "";
      delete normalizedPayload.codFile;
      delete normalizedPayload.COD_FILE;
    }

    Object.entries(normalizedPayload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(`${key}[]`, item));
      } else {
        formData.append(key, value);
      }
    });
  }

  return formData;
}

/**
 * Hook para subir/guardar archivos al servidor
 * @param {Object} options - Opciones adicionales para la mutación
 * @returns {UseMutationResult} Mutation hook que retorna la ruta del archivo
 *
 * @payload Campos según tipo_documento:
 * - Común: { archivo: File, tipo_documento: string }
 * - Entidades: { cod_tipo, entidad_id }
 * - Coordinaciones: { embarque_id, cod_file }
 * - Cotizaciones: { cod_tip_doc, cod_cotizacion_cabecera }
 *
 * Tipos de documento: 'admon', 'entidad', 'global', 'coordinaciones', 'cotizaciones'
 *
 * @example
 * const { mutateAsync } = useGuardarArchivo();
 * const ruta = await mutateAsync({
 *   archivo: file,
 *   tipo_documento: 'coordinaciones',
 *   embarque_id: 123,
 *   cod_file: 'ABC123'
 * });
 */
export function useGuardarArchivo(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const formData = buildFormData(payload);

      const response = await api.post("/api/appweb/guardar-archivo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data?.data?.ruta_archivo ?? response.data;
    },
    ...options,
  });
}
