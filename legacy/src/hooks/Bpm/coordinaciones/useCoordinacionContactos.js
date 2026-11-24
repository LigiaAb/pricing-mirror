import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener contactos de coordinación (con filtros generales)
 * @param {Object} filters - Filtros opcionales
 * @returns {UseQueryResult} Query result con contactos mapeados
 */
export function useFetchCoordinacionContacto(filters = {}) {
  return useQuery({
    queryKey: ["coordinacion-contacto", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listar-coordinacion-contacto", {
        params: filters,
      });
      return extractResponseData(response).map((item) => ({
        id_contacto_coordinacion: item.id_contacto_coordinacion,
        embarque_id: item.embarque_id,
        cod_file: item.cod_file,
        emb_legs_id: item.emb_legs_id,
        entidadcontacto_id: item.entidadcontacto_id,
        entidad_id: item.entidad_id,
        cod_tipo: item.cod_tipo,
        entidad_contacto_nombre: item.entidad_contacto_nombre,
        entidad_contacto_email: item.entidad_contacto_email,
        entidad_contacto_telefono: item.entidad_contacto_telefono,
        fecha_registro: item.fecha_registro,
        usuario_id_agrega: item.usuario_id_agrega,
        usuario_crea: item.usuario_crea,
        instrucciones: item.instrucciones,
      }));
    },
    ...CACHE_SEMI_STATIC,
  });
}

/**
 * Hook para obtener contactos de una coordinación específica
 * @param {{ cod_coordinacion: string|number }} params - Código de coordinación
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con contactos para select
 */
export function useCoordinacionContactos({ cod_coordinacion }, options = {}) {
  return useQuery({
    queryKey: ["coordinacion-contactos", cod_coordinacion],
    queryFn: async () => {
      const { data } = await api.get("/api/appweb/listar-coordinacion-contacto", {
        params: { cod_coordinacion },
      });
      return (Array.isArray(data) ? data : []).map((item) => ({
        contacto: { value: item.CONTACTO_ID, label: item.CONTACTO_NOMBRE },
        tipoContacto: {
          value: item.TIPO_CONTACTO_ID,
          label: item.TIPO_CONTACTO_NOMBRE,
        },
        email: item.CONTACTO_EMAIL,
        telefono: item.CONTACTO_TELEFONO,
      }));
    },
    enabled: !!cod_coordinacion,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
