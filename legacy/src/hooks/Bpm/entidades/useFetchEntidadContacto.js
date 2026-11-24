import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { CACHE_SEMI_STATIC } from "../utils";

const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

/**
 * Hook para obtener lista de contactos de entidad
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} params.cod_tipo - Código de tipo de entidad (requerido)
 * @param {number} [params.entidadcontacto_id] - Código del contacto de entidad
 * @param {number} [params.entidad_id] - Código de la entidad
 * @param {number} [params.cod_emp] - Código de empresa
 * @param {number} [params.cod_cc] - Código de centro de costo
 * @param {number} [params.nopagina] - Número de página para paginación 
 * @param {Object} options - Opciones adicionales de useQuery
 * @returns {UseQueryResult} Query result con contactos de entidad
 */
export function useFetchEntidadContacto(params = {}, options = {}) {
  const { cod_tipo, entidadcontacto_id, entidad_id, cod_emp, cod_cc, nopagina } = params;

  const token = getAuthToken();

  return useQuery({
    queryKey: ["entidad-contacto", params, token],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-entidad-contacto", {
        params: {
          cod_tipo,
          ...(entidadcontacto_id && { entidadcontacto_id }),
          ...(entidad_id && { entidad_id }),
          ...(cod_emp && { cod_emp }),
          ...(cod_cc && { cod_cc }),
          ...(nopagina && { nopagina }),
        },
      });

      const responseData = response?.data?.data || {};

      // Las keys ya vienen en minúsculas por el interceptor de api.js (convertKeysToLowerCase)
      return {
        total_paginas: responseData.total_paginas || 0,
        total_registros: responseData.total_registros || 0,
        data: (responseData.data || []).map((contacto) => ({
          entidadcontacto_id: contacto.entidadcontacto_id,
          codigo_entidad: contacto.codigo_entidad,
          entidad_nombre: contacto.entidad_nombre,
          entidad_id: contacto.entidad_id,
          cod_emp: contacto.cod_emp,
          cod_cc: contacto.cod_cc,
          nombre_emp: contacto.nombre_emp,
          nombre_cc: contacto.nombre_cc,
          entidadcontacto_nombre: contacto.entidadcontacto_nombre,
          entidadcontacto_email: contacto.entidadcontacto_email,
          entidadcontacto_telefono: contacto.entidadcontacto_telefono,
          cod_estado: contacto.cod_estado,
          estado_desc: contacto.estado_desc,
          data_entidad_contacto_tipo: contacto.data_entidad_contacto_tipo
            ? JSON.parse(contacto.data_entidad_contacto_tipo)
            : [],
          cod_tratamiento: contacto.cod_tratamiento,
          tratamiento_descripcion: contacto.tratamiento_descripcion,
          cod_temperamento: contacto.cod_temperamento,
          temperamento_descripcion: contacto.temperamento_descripcion,
        })),
      };
    },
    enabled: Boolean(cod_tipo),
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
