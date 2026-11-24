import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook público para obtener la lista de industrias.
 * GET /clientes/api/v2/lista-industria
 * Headers Authorization y version_app los inyecta el interceptor de api_no_auth_v2.
 * Data pública: queryKey no depende del token.
 *
 * @returns {UseQueryResult} Query result con industrias mapeadas
 */
export function useFetchIndustriasPublico() {
  return useQuery({
    queryKey: ["industrias-publico"],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/lista-industria");

      return extractResponseData(response).map((i) => ({
        cod_industria: i.COD_INDUSTRIA ?? i.cod_industria,
        nom_industria_es: i.NOM_INDUSTRIA_ES ?? i.nom_industria_es,
      }));
    },
    ...CACHE_STATIC,
  });
}
