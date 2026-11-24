import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook público para obtener municipios filtrando por departamento.
 * GET /clientes/api/v2/lista-municipios?cod_depto=
 * Headers Authorization y version_app los inyecta el interceptor de api_no_auth_v2.
 * Data pública: el token NO forma parte del queryKey.
 *
 * @param {number|string} codDepto - Código del departamento
 * @returns {UseQueryResult} Query result con municipios mapeados
 */
export function useFetchMunicipiosPublico(codDepto) {
  return useQuery({
    queryKey: ["municipios-publico", codDepto],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/lista-municipios", {
        params: { cod_depto: codDepto },
      });

      return extractResponseData(response).map((m) => ({
        cod_muni: m.COD_MUNI ?? m.cod_muni,
        cod_depto: m.COD_DEPTO ?? m.cod_depto,
        nombre_depto: m.NOMBRE_DEPTO ?? m.nombre_depto,
        nombre_muni: m.NOMBRE_MUNI ?? m.nombre_muni,
        cod_estado: m.COD_ESTADO ?? m.cod_estado,
        estado_desc: m.ESTADO_DESC ?? m.estado_desc,
      }));
    },
    enabled: Boolean(codDepto),
    ...CACHE_STATIC,
  });
}
