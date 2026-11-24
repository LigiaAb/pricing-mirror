import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook público para obtener lista de paises
 * GET /clientes/api/v2/listapaises
 * Los headers Authorization (token_interaccion) y version_app los inyecta
 * el interceptor request de api_no_auth_v2 desde localStorage.
 *
 * La data es pública e idéntica para todos los usuarios, por lo que el
 * queryKey NO depende del token: cualquier cache sirve para cualquier sesión.
 *
 * Respuesta esperada:
 * {status: 200, message: "SUCCESS", data: [{COD_PAIS, NOMBRE_PAIS, REF_PAIS, REF_PAIS_2, COD_CONTINENTE, NOMBRE_CONTINENTE}]}
 *
 * @returns {UseQueryResult} Query result con paises mapeados
 */
export function useFetchPaisesPublico() {
  return useQuery({
    queryKey: ["paises-publico"],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/listapaises");

      return extractResponseData(response).map((pais) => ({
        cod_pais: pais.COD_PAIS ?? pais.cod_pais ?? pais.cod,
        nombre_pais: pais.NOMBRE_PAIS ?? pais.nombre_pais ?? pais.nombre,
        ref_pais: pais.REF_PAIS ?? pais.ref_pais ?? null,
        ref_pais_2: pais.REF_PAIS_2 ?? pais.ref_pais_2 ?? null,
        cod_continente: pais.COD_CONTINENTE ?? pais.cod_continente ?? null,
        nombre_continente: pais.NOMBRE_CONTINENTE ?? pais.nombre_continente ?? null,
      }));
    },
    ...CACHE_STATIC,
  });
}
