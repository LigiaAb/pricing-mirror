import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook para obtener lista de monedas
 *
 * Parámetros (GET /api/appweb/lista-moneda):
 * - es_operativa (boolean) : Opcional, filtra solo monedas operativas cuando se true
 *
 * Ejemplo respuesta esperada:
 * {
 *   "status": 200,
 *   "message": "SUCCESS",
 *   "length": 7,
 *   "data": [
 *     {
 *       "COD_MONEDA": 1,
 *       "NOM_MONEDA": "Quetzales",
 *       "COD_PAIS": 1002,
 *       "SIMBOLO_MONEDA": "GTQ",
 *       "COD_SERV_BANCO": "0",
 *       "ES_OPERATIVA": true,
 *       "COD_ESTADO": 1
 *     },
 *     ...
 *   ]
 * }
 *
 * @param {Object} filters - Filtros opcionales (ej: es_operativa)
 * @returns {UseQueryResult} Query result con monedas mapeadas
 */
export function useFetchMonedas(filters = {}) {
  return useQuery({
    queryKey: ["monedas", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-moneda", {
        params: filters,
      });
      return extractResponseData(response).map((moneda) => ({
        cod_moneda: moneda.COD_MONEDA ?? moneda.cod_moneda,
        nom_moneda: moneda.NOM_MONEDA ?? moneda.nom_moneda,
        cod_pais: moneda.COD_PAIS ?? moneda.cod_pais,
        simbolo_moneda: moneda.SIMBOLO_MONEDA ?? moneda.simbolo_moneda,
        cod_serv_banco: moneda.COD_SERV_BANCO ?? moneda.cod_serv_banco,
        es_operativa: moneda.ES_OPERATIVA ?? moneda.es_operativa,
        cod_estado: moneda.COD_ESTADO ?? moneda.cod_estado,
      }));
    },
    ...CACHE_STATIC,
  });
}
