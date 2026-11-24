import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener lista de centros de costo
 * @param {Object} filters - Filtros opcionales
 * @returns {UseQueryResult} Query result con centros de costo mapeados
 */
export function useFetchCentrosCosto(filters = {}) {
  return useQuery({
    queryKey: ["centros-costo", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listacentrocosto", {
        params: filters,
      });
      return extractResponseData(response).map((cc) => ({
        codCc: cc.cod_cc,
        codEmpresaCc: cc.cod_empresa_cc,
        nombreCc: cc.nombre_cc,
        nombreEmp: cc.nombre_emp,
        codCropa: cc.cod_cropa,
      }));
    },
    ...CACHE_SEMI_STATIC,
  });
}

/**
 * Hook para obtener centros de costo filtrados por empresa
 * @param {{ cod_empresa: string|number }} params - Código de empresa
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con centros de costo para select
 */
export function useCentrosCostoPorEmpresa({ cod_empresa }, options = {}) {
  return useQuery({
    queryKey: ["centros-costo-empresa", cod_empresa || null],
    queryFn: async () => {
      const params = {};
      if (cod_empresa) params.cod_empresa = cod_empresa;
      const { data } = await api.get("/api/appweb/listacentrocosto", { params });
      const realData = data?.data || [];
      return (Array.isArray(realData) ? realData : []).map((item) => ({
        value: item.cod_cc,
        label: item.nombre_cc,
        cod_empresa: item.cod_empresa_cc,
        codCropa: item.cod_cropa,
      }));
    },
    enabled: !!cod_empresa,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
