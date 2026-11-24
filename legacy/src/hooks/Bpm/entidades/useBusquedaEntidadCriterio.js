import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para buscar entidades por criterio
 * @param {Object} params - Parámetros de búsqueda
 * @param {string|number} params.ref_busqueda - Referencia de búsqueda (ID u otro criterio)
 * @param {string[]} params.list_descripcion_tipo - Lista de tipos de entidad (ej: ["PRE-CLIENTE", "CLIENTE"])
 * @param {string} params.tipo_busqueda - Tipo de búsqueda (ej: "ID")
 * @param {Object} options - Opciones adicionales de useQuery
 * @returns {UseQueryResult} Query result con entidades y tipos encontrados
 */
export function useBusquedaEntidadCriterio(params, options = {}) {
  const { ref_busqueda, list_descripcion_tipo, tipo_busqueda } = params;

  return useQuery({
    queryKey: ["busqueda-entidad-criterio", params],
    queryFn: async () => {
      const response = await api.get("/api/appweb/busqueda-entidad-x-criterio", {
        params: {
          ref_busqueda,
          list_descripcion_tipo,
          tipo_busqueda,
        },
      });

      // Extraer datos de la estructura response.data.data
      const responseData = response?.data?.data || {};

      return {
        entidades: (responseData.data || []).map((ent) => ({
          codigo_entidad: ent.CODIGO_ENTIDAD,
          entidad_id: ent.ENTIDAD_ID,
          entidadnombre_nombre: ent.ENTIDADNOMBRE_NOMBRE,
          cod_tipo: ent.COD_TIPO,
          tipo_desc: ent.TIPO_DESC,
          entidad_nombre: ent.ENTIDAD_NOMBRE,
          cod_tipo_identificacion: ent.COD_TIPO_IDENTIFICACION,
          tipo_identificacion_desc: ent.TIPO_IDENTIFICACION_DESC,
        })),
        list_cod_tipo: responseData.list_cod_tipo || [],
        success: responseData.success,
      };
    },
    enabled:
      Boolean(ref_busqueda) &&
      Array.isArray(list_descripcion_tipo) &&
      list_descripcion_tipo.length > 0 &&
      Boolean(tipo_busqueda),
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
