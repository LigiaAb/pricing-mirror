import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook público para obtener lista de ciudades por pais
 * GET /clientes/api/v2/lista-ciudad?cod_pais=
 * Headers Authorization y version_app los inyecta el interceptor de api_no_auth_v2.
 * Data pública: el token NO forma parte del queryKey.
 *
 * @param {number|string} codPais - Código del país
 * @returns {UseQueryResult} Query result con ciudades mapeadas
 */
export function useFetchCiudadesPublico(codPais) {
  return useQuery({
    queryKey: ["ciudades-publico", codPais],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/lista-ciudad", {
        params: { cod_pais: codPais },
      });

      return extractResponseData(response).map((ciudad) => ({
        cod_ciudad: ciudad.COD_CIUDAD ?? ciudad.cod_ciudad ?? null,
        cod_pais: ciudad.COD_PAIS ?? ciudad.cod_pais ?? null,
        nombre_pais: ciudad.NOMBRE_PAIS ?? ciudad.nombre_pais ?? null,
        nombre_ciudad: ciudad.NOMBRE_CIUDAD ?? ciudad.nombre_ciudad ?? ciudad.nombre ?? "",
        cod_estado: ciudad.COD_ESTADO ?? ciudad.cod_estado ?? null,
        estado_desc: ciudad.ESTADO_DESC ?? ciudad.estado_desc ?? null,
        siglas_ciudad: ciudad.SIGLAS_CIUDAD ?? ciudad.siglas_ciudad ?? null,
      }));
    },
    enabled: Boolean(codPais),
    ...CACHE_STATIC,
  });
}
