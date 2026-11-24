import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

/**
 * Hook para obtener direcciones de entidades
 *
 * Los filtros aceptados son numéricos; si se pasan como string se convertirán en
 * parámetros de consulta sin validación adicional por el hook. En particular:
 *   - cod_tipo {number}        código del tipo de dirección (ej. 145)
 *   - entidad_id {number}      id de la entidad a la que pertenecen las direcciones
 *   - cod_pais {number}        código de país asociado
 *   - cod_depto {number}       código de departamento asociado
 *   - cod_muni {number}        código de municipio asociado
 *
 * La opción `enabled` se activa automáticamente si se proporciona `cod_tipo` y
 * `entidad_id` (aunque este último puede ser 0).
 *
 * @param {Object} filters - Filtros opcionales (ej: { cod_tipo: 145, entidad_id: 123 })
 * @param {Object} options - Opciones adicionales de useQuery
 * @returns {UseQueryResult} Query result con direcciones de entidades mapeadas
 */
export function useFetchEntidadesDireccion(filters = {}, options = {}) {
  const token = getAuthToken();

  return useQuery({
    queryKey: ["entidades-direccion", filters, token],
    enabled: Boolean(filters.cod_tipo && (filters.entidad_id || filters.entidad_id === 0)),
    queryFn: async () => {
      // ensure numeric filters are passed as numbers (API expects numeric codes)
      const params = { ...filters };
      ["cod_tipo", "entidad_id", "cod_pais", "cod_depto", "cod_muni"].forEach((k) => {
        if (params[k] != null && params[k] !== "") {
          const n = Number(params[k]);
          if (!Number.isNaN(n)) params[k] = n;
        }
      });

      const response = await api.get("/api/appweb/lista-entidad-direccion", {
        params,
      });
      const responseData = extractResponseData(response);
      return responseData.map((ent) => ({
        codigo_entidad: ent.codigo_entidad ?? ent.CODIGO_ENTIDAD,
        entidad_id: ent.entidad_id ?? ent.ENTIDAD_ID,
        entidad_nombre: ent.entidad_nombre ?? ent.ENTIDAD_NOMBRE,
        entidaddireccion_id: ent.entidaddireccion_id || ent.ENTIDADDIRECCION_ID,
        cod_tipo: ent.cod_tipo ?? ent.COD_TIPO,
        tipo_descripcion: ent.tipo_descripcion ?? ent.TIPO_DESCRIPCION,
        entidad_clasificacion: ent.entidad_clasificacion ?? ent.ENTIDAD_CLASIFICACION,
        cod_pais: ent.cod_pais ?? ent.COD_PAIS,
        nombre_pais: ent.nombre_pais ?? ent.NOMBRE_PAIS,
        cod_ciudad: ent.cod_ciudad ?? ent.COD_CIUDAD,
        nombre_ciudad: ent.nombre_ciudad ?? ent.NOMBRE_CIUDAD,
		cod_depto: ent.cod_depto ?? ent.COD_DEPTO,
		nombre_depto: ent.nombre_depto ?? ent.NOMBRE_DEPTO ?? "",
		cod_muni: ent.cod_muni ?? ent.COD_MUNI,
		nombre_muni: ent.nombre_muni ?? ent.NOMBRE_MUNI ?? "",
        entidaddireccion_zona: ent.entidaddireccion_zona ?? ent.ENTIDADDIRECCION_ZONA,
        entidaddireccion_km: ent.entidaddireccion_km ?? ent.ENTIDADDIRECCION_KM,
        direccion: ent.entidaddireccion_direccion ?? ent.ENTIDADDIRECCION_DIRECCION ?? ent.direccion,
        referencia: ent.referencia,
        cod_estado: ent.cod_estado ?? ent.COD_ESTADO,
        estado_desc: ent.estado_desc ?? ent.ESTADO_DESC,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
