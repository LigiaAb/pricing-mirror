import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook para obtener lista de paises
 *
 * Parámetros (GET /api/appweb/listapaises):
 * NOMBRE     | OBLIGATORIO | TIPO     | TAMAÑO | DESCRIPCIÓN
 * cod_pais   | NO          | Numérico | 1-5    | Código del país que permite recuperar únicamente información del que se desea consultar
 *
 * Ejemplo respuesta esperada:
 * {
 *   "status": 200,
 *   "message": "SUCCESS",
 *   "length": 1,
 *   "data": [
 *     {
 *       "COD_PAIS": 1001,
 *       "NOMBRE_PAIS": "Guatemala",
 *       "REF_PAIS": "GTM",
 *       "REF_PAIS_2": "GT"
 *     }
 *   ]
 * }
 *
 * @param {Object} filters - Filtros opcionales (ej: cod_pais)
 * @param {Object} options - Opciones adicionales (ej: allowedCountries para filtrar por IDs específicos)
 * @returns {UseQueryResult} Query result con paises mapeados
 */
export function useFetchPaises(filters = {}, options = {}) {
  const { allowedCountries = null, ...queryOptions } = options;

  return useQuery({
    queryKey: ["paises", filters, allowedCountries],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listapaises", {
        params: filters,
      });
      let paises = extractResponseData(response).map((pais) => ({
        cod_pais: pais.COD_PAIS ?? pais.cod_pais ?? pais.cod,
        nombre_pais: pais.NOMBRE_PAIS ?? pais.nombre_pais ?? pais.nombre,
        ref_pais: pais.REF_PAIS ?? pais.ref_pais ?? null,
        ref_pais_2: pais.REF_PAIS_2 ?? pais.ref_pais_2 ?? null,
      }));

      if (allowedCountries?.length > 0) {
        paises = paises.filter((p) => allowedCountries.includes(p.cod_pais));
      }

      return paises;
    },
    ...CACHE_STATIC,
    ...queryOptions,
  });
}
