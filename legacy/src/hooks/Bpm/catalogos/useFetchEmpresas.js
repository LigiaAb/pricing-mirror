import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook para obtener lista de empresas
 * @param {Object} filters - Filtros opcionales
 * @returns {UseQueryResult} Query result con empresas mapeadas
 */
export function useFetchEmpresas(filters = {}) {
  return useQuery({
    queryKey: ["empresas", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listaempresas", {
        params: filters,
      });
      return extractResponseData(response).map((empresa) => ({
        cod_empresa: empresa.cod_empresa,
        nombre_emp: empresa.nombre_emp,
        paisEmp: empresa.pais_emp,
        nitEmp: empresa.nit_emp,
        direccionEmp: empresa.direccion_emp,
        logoEmp: empresa.logo_emp,
        fechaIngreso: empresa.fecha_ingreso,
        codCropa: empresa.cod_cropa,
      }));
    },
    ...CACHE_STATIC,
  });
}
