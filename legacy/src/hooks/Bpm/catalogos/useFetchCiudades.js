import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook para obtener lista de ciudades filtrando por país.
 *
 * Endpoint: GET /api/appweb/lista-ciudad?cod_pais=
 * Parámetros opcionales:
 *   cod_pais - Numérico: código del país
 *
 * @param {Object} filters - Filtros opcionales (ej: { cod_pais: 1001 })
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Resultado con ciudades mapeadas
 */
export function useFetchCiudades(filters = {}, options = {}) {
  const codPais = filters?.cod_pais ?? filters;
  return useQuery({
    queryKey: ["ciudades", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-ciudad", {
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
        value: ciudad.COD_CIUDAD ?? ciudad.cod_ciudad ?? null,
        label: ciudad.NOMBRE_CIUDAD ?? ciudad.nombre_ciudad ?? ciudad.nombre ?? "",
      }));
    },
    enabled: Boolean(codPais),
    ...CACHE_STATIC,
    ...options,
  });
}
