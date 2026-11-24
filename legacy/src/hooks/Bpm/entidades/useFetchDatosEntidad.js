import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import api_no_auth_v2 from "../utils/apiPublic";
import { CACHE_SEMI_STATIC } from "../utils";

// La API de recuperar-datos-entidad devuelve claves en MAYÚSCULAS; normalizamos
// a minúsculas recursivamente para que los mapXxx de abajo (que leen claves en
// minúscula) encuentren los valores.
const normalizeKeys = (obj) => {
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.toLowerCase(), normalizeKeys(v)]),
    );
  }
  return obj;
};

const mapEntidad = (e) => ({
  codigo_entidad: e.codigo_entidad,
  entidad_id: e.entidad_id,
  entidad_nombre: e.entidad_nombre,
  cod_tipo: e.cod_tipo,
  tipo_descripcion: e.tipo_descripcion,
  entidad_clasificacion: e.entidad_clasificacion,
  cod_industria: e.cod_industria,
  nom_industria_es: e.nom_industria_es,
  cod_pais: e.cod_pais,
  nombre_pais: e.nombre_pais,
  cod_ciudad: e.cod_ciudad,
  nombre_ciudad: e.nombre_ciudad,
  cod_estado: e.cod_estado,
  estado_desc: e.estado_desc,
  limite_credito: e.limite_credito,
  cod_moneda_credito: e.cod_moneda_credito,
  utilizacion_credito: e.utilizacion_credito,
  moneda_credito_desc: e.moneda_credito_desc,
  moneda_credito_simbolo: e.moneda_credito_simbolo,
});

const mapNombre = (n) => ({
  entidadnombre_id: n.entidadnombre_id,
  codigo_entidad: n.codigo_entidad,
  entidad_nombre: n.entidad_nombre,
  entidad_id: n.entidad_id,
  entidadnombre_nombre: n.entidadnombre_nombre,
  cod_tipo: n.cod_tipo,
  tipo_descripcion: n.tipo_descripcion,
  cod_estado: n.cod_estado,
  estado_desc: n.estado_desc,
  cod_pais: n.cod_pais,
  nombre_pais: n.nombre_pais,
});

const mapIdentificacion = (i) => ({
  entidadidentificacion_id: i.entidadidentificacion_id,
  codigo_entidad: i.codigo_entidad,
  entidad_id: i.entidad_id,
  entidad_nombre: i.entidad_nombre,
  cod_identificacion: i.cod_identificacion,
  nom_identificacion: i.nom_identificacion,
  entidadidentificacio_numero: i.entidadidentificacio_numero,
  cod_estado: i.cod_estado,
  estado_desc: i.estado_desc,
  entidadidentificacion_fecha_inicio: i.entidadidentificacion_fecha_inicio,
  entidadidentificacion_fecha_fin: i.entidadidentificacion_fecha_fin,
  entidadidentificacion_ruta: i.entidadidentificacion_ruta,
});

const mapContacto = (c) => ({
  entidadcontacto_id: c.entidadcontacto_id,
  codigo_entidad: c.codigo_entidad,
  entidad_nombre: c.entidad_nombre,
  entidad_id: c.entidad_id,
  cod_emp: c.cod_emp,
  cod_cc: c.cod_cc,
  nombre_emp: c.nombre_emp,
  nombre_cc: c.nombre_cc,
  entidadcontacto_nombre: c.entidadcontacto_nombre,
  entidadcontacto_email: c.entidadcontacto_email,
  entidadcontacto_telefono: c.entidadcontacto_telefono,
  cod_estado: c.cod_estado,
  estado_desc: c.estado_desc,
  data_entidad_contacto_tipo: c.data_entidad_contacto_tipo
    ? JSON.parse(c.data_entidad_contacto_tipo)
    : [],
});

const mapDireccion = (d) => ({
  entidaddireccion_id: d.entidaddireccion_id,
  codigo_entidad: d.codigo_entidad,
  entidad_nombre: d.entidad_nombre,
  entidad_id: d.entidad_id,
  cod_tipo: d.cod_tipo,
  tipo_descripcion: d.tipo_descripcion,
  entidaddireccion_direccion: d.entidaddireccion_direccion,
  entidaddireccion_zona: d.entidaddireccion_zona,
  entidaddireccion_km: d.entidaddireccion_km,
  cod_muni: d.cod_muni,
  nombre_muni: d.nombre_muni,
  cod_depto: d.cod_depto,
  nombre_depto: d.nombre_depto,
  cod_pais: d.cod_pais,
  nombre_pais: d.nombre_pais,
  cod_estado: d.cod_estado,
  estado_desc: d.estado_desc,
});

/**
 * Hook para obtener datos completos de una entidad (vista privada/interna).
 * POST api/appweb/recuperar-datos-entidad
 * A diferencia del endpoint público (`/clientes/api/v2/...`), este requiere
 * sesión autenticada y exige `cod_tipo` además de `entidad_id`.
 *
 * @param {Object} params - Parámetros de búsqueda
 * @param {number|string} [params.entidad_id] - ID de la entidad
 * @param {number} [params.cod_tipo] - Clasificación de la entidad (default 3 = CLIENTE)
 * @param {Object} options - Opciones adicionales de useQuery
 * @returns {UseQueryResult} Query result con data_entidad, data_nombres, data_identificaciones, data_contactos, data_direcciones
 */
export function useFetchDatosEntidad(params = {}, options = {}) {
  return useQuery({
    queryKey: ["datos-entidad", params],
    queryFn: async () => {
      const response = await api.post("api/appweb/recuperar-datos-entidad", {
        cod_tipo: 3,
        ...params,
      });

      const responseData = normalizeKeys(response?.data?.data || {});

      return {
        success: responseData.success,
        cod_mensaje: responseData.cod_mensaje,
        data_entidad: (responseData.data_entidad || []).map(mapEntidad),
        data_nombres: (responseData.data_nombres || []).map(mapNombre),
        data_identificaciones: (responseData.data_identificaciones || []).map(mapIdentificacion),
        data_contactos: (responseData.data_contactos || []).map(mapContacto),
        data_direcciones: (responseData.data_direcciones || []).map(mapDireccion),
      };
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}

/**
 * Hook público para obtener datos completos de una entidad
 * GET /clientes/api/v2/recuperar-datos-entidad
 * Headers Authorization y version_app los inyecta el interceptor de api_no_auth_v2.
 */
export function useFetchDatosEntidadPublico(params = {}, options = {}) {
  return useQuery({
    queryKey: ["datos-entidad-publico", params],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/recuperar-datos-entidad", {
        params,
      });
      const responseData = normalizeKeys(response?.data?.data || {});
      return {
        success: responseData.success,
        cod_mensaje: responseData.cod_mensaje,
        data_entidad: (responseData.data_entidad || []).map(mapEntidad),
        data_nombres: (responseData.data_nombres || []).map(mapNombre),
        data_identificaciones: (responseData.data_identificaciones || []).map(mapIdentificacion),
        data_contactos: (responseData.data_contactos || []).map(mapContacto),
        data_direcciones: (responseData.data_direcciones || []).map(mapDireccion),
      };
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
