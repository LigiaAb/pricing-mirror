import useCustomMutation from "../../Fetch/useCustomMutation";
import api_no_auth_v2 from "../utils/apiPublic";

const ENDPOINT = "/clientes/api/v2/recuperar-archivo";

/**
 * Hook público para recuperar/descargar archivos desde la vista pública CTS.
 * Usa `api_no_auth_v2` (token_interaccion + version_app via headers).
 *
 * @payload { ruta_archivo: string } - Ruta del archivo a recuperar
 *
 * @example
 * const { mutateAsync } = useRecuperarArchivoPublico();
 * const blob = await mutateAsync({ ruta_archivo: '/cropa/admo/recursos/file.pdf' });
 * const url = URL.createObjectURL(blob);
 * window.open(url);
 */
export function useRecuperarArchivoPublico(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const response = await api_no_auth_v2.post(ENDPOINT, payload, {
        responseType: "blob",
      });
      return response.data;
    },
    ...options,
  });
}
