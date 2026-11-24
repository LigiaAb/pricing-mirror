import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook público para obtener departamentos filtrando por país.
 * GET /clientes/api/v2/lista-depto-x-pais?cod_pais=
 * Headers Authorization y version_app los inyecta el interceptor de api_no_auth_v2.
 * Data pública: el token NO forma parte del queryKey.
 *
 * @param {number|string} codPais - Código del país
 * @returns {UseQueryResult} Query result con departamentos mapeados
 */
export function useFetchDepartamentosPublico(codPais) {
  return useQuery({
    queryKey: ["departamentos-publico", codPais],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/lista-depto-x-pais", {
        params: { cod_pais: codPais },
      });

      return extractResponseData(response).map((d) => ({
        cod_depto: d.COD_DEPTO ?? d.cod_depto,
        cod_pais: d.COD_PAIS ?? d.cod_pais,
        nombre_pais: d.NOMBRE_PAIS ?? d.nombre_pais,
        nombre_depto: d.NOMBRE_DEPTO ?? d.nombre_depto,
        num_depto: d.NUM_DEPTO ?? d.num_depto,
        cod_estado: d.COD_ESTADO ?? d.cod_estado,
        estado_desc: d.ESTADO_DESC ?? d.estado_desc,
      }));
    },
    enabled: Boolean(codPais),
    ...CACHE_STATIC,
  });
}
