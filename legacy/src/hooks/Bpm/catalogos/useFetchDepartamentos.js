import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener departamentos filtrando por país
 *
 * Endpoint: GET /api/appweb/lista-depto-x-pais
 * Parámetros opcionales:
 *   cod_pais - Numérico 1-5: código del país cuyos departamentos se desean recuperar
 *
 * Ejemplo de respuesta esperada:
 * {
 *   "status": 200,
 *   "message": "SUCCESS",
 *   "length": 5105,
 *   "data": [
 *     {
 *       "COD_DEPTO": 3,
 *       "COD_PAIS": 1001,
 *       "NOMBRE_PAIS": "Guatemala",
 *       "NOMBRE_DEPTO": "Guatemala",
 *       "NUM_DEPTO": 1401,
 *       "COD_ESTADO": 1,
 *       "ESTADO_DESC": "ACTIVO"
 *     },
 *     ...
 *   ]
 * }
 *
 * @param {Object} filters - Filtros opcionales (ej: { cod_pais: 1001 })
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Resultado de la consulta con departamentos mapeados
 */
export function useFetchDepartamentos(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["departamentos", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-depto-x-pais", {
        params: filters,
      });
      return extractResponseData(response).map((d) => ({
        cod_depto: d.COD_DEPTO ?? d.cod_depto,
        cod_pais: d.COD_PAIS ?? d.cod_pais,
        nombre_pais: d.NOMBRE_PAIS ?? d.nombre_pais,
        nombre_depto: d.NOMBRE_DEPTO ?? d.nombre_depto,
        num_depto: d.NUM_DEPTO ?? d.num_depto,
        cod_estado: d.COD_ESTADO ?? d.cod_estado,
        estado_desc: d.ESTADO_DESC ?? d.estado_desc,
        value: d.COD_DEPTO ?? d.cod_depto,
        label: d.NOMBRE_DEPTO ?? d.nombre_depto,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
