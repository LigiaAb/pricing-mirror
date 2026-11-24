import useCustomMutation from "../../Fetch/useCustomMutation";
import api_no_auth_v2 from "../utils/apiPublic";

const ENDPOINT = "/clientes/api/v2/guardar-archivo";

function buildFormData(payload) {
  if (payload instanceof FormData) return payload;

  const formData = new FormData();
  if (payload && typeof payload === "object") {
    Object.entries(payload).forEach(([key, value]) => {
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
 * Hook público para subir archivos al backend desde la vista pública CTS.
 * Usa `api_no_auth_v2` (token_interaccion + version_app via headers).
 *
 * @payload Campos según tipo_documento:
 * - { archivo: File, tipo_documento: string, embarque_id: string|number, cod_file: string }
 *
 * @example
 * const { mutateAsync, isLoading } = useGuardarArchivoPublico();
 * const ruta = await mutateAsync({
 *   archivo: pdfFile,
 *   tipo_documento: "coordinaciones",
 *   embarque_id: embarqueId,
 *   cod_file: codFile,
 * });
 */
export function useGuardarArchivoPublico(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const formData = buildFormData(payload);
      const response = await api_no_auth_v2.post(ENDPOINT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response?.data?.data?.ruta_archivo ?? response?.data;
    },
    ...options,
  });
}