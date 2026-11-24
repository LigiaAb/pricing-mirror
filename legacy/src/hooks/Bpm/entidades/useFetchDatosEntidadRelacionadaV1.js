import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { CACHE_SEMI_STATIC } from "../utils";

const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const pickNum = (obj, ...keys) => {
  const raw = pick(obj, ...keys);
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const pickStr = (obj, ...keys) => {
  const raw = pick(obj, ...keys);
  return raw === undefined || raw === null ? "" : String(raw);
};

/**
 * Mapea una fila de /api/appweb/lista-entidad-relacion al shape
 * devuelto por la versión v2 (/clientes/api/v2/recuperar-datos-entidad-relacionada).
 *
 * La v1 entrega relaciones entre dos entidades (entidad_id_1 / entidad_id_2);
 * resolvemos la entidad "del otro lado" respecto al `entidad_id` solicitado y
 * exponemos solo los campos que existen en la v2. Los sub-arrays
 * (data_contactos / data_direcciones / data_identificaciones / data_nombres)
 * quedan vacíos porque la v1 no los incluye.
 */
const mapRelacionToEntidad = (row, entidadIdConsulta) => {
  if (!row) return null;
  const id1 = pickNum(row, "entidad_id_1", "ENTIDAD_ID_1");
  const id2 = pickNum(row, "entidad_id_2", "ENTIDAD_ID_2");

  // Determinar qué lado es la entidad consultada. Si ninguno coincide,
  // la fila no aplica al filtro y la descartamos.
  let other;
  if (entidadIdConsulta != null && id1 === entidadIdConsulta) {
    other = {
      entidad_id: id2,
      entidad_nombre: pickStr(row, "entidad_nombre_2", "ENTIDAD_NOMBRE_2"),
      cod_tipo: pickNum(row, "cod_tipo_e2", "COD_TIPO_E2"),
      tipo_descripcion: pickStr(row, "tipo_descripcion_e2", "TIPO_DESCRIPCION_E2"),
    };
  } else if (entidadIdConsulta != null && id2 === entidadIdConsulta) {
    other = {
      entidad_id: id1,
      entidad_nombre: pickStr(row, "entidad_nombre_1", "ENTIDAD_NOMBRE_1"),
      cod_tipo: pickNum(row, "cod_tipo_e1", "COD_TIPO_E1"),
      tipo_descripcion: pickStr(row, "tipo_descripcion_e1", "TIPO_DESCRIPCION_E1"),
    };
  } else {
    return null;
  }

  const tipoRelacionDescripcion = pickStr(row, "tipo_descripcion_e1", "TIPO_DESCRIPCION_E1") ||
    pickStr(row, "tipo_descripcion_e2", "TIPO_DESCRIPCION_E2");

  return {
    entidad_id: other.entidad_id,
    cod_tipo: other.cod_tipo,
    cod_tipo_relacion: pickNum(row, "cod_tipo", "COD_TIPO"),
    descripcion_tipo_relacion: tipoRelacionDescripcion,
    codigo_entidad: null,
    entidad_nombre: other.entidad_nombre,
    tipo_descripcion: other.tipo_descripcion,
    entidad_clasificacion: other.tipo_descripcion,
    cod_industria: null,
    nom_industria_es: null,
    cod_pais: null,
    nombre_pais: null,
    cod_ciudad: null,
    nombre_ciudad: null,
    cod_estado: pickNum(row, "cod_estado", "COD_ESTADO"),
    estado_desc: null,
    limite_credito: null,
    cod_moneda_credito: null,
    utilizacion_credito: null,
    moneda_credito_desc: null,
    moneda_credito_simbolo: null,
    data_nombres: [],
    data_identificaciones: [],
    data_contactos: [],
    data_direcciones: [],
  };
};

/**
 * Hook para obtener datos de entidades relacionadas (versión v1 / appweb).
 * GET /api/appweb/lista-entidad-relacion
 *
 * Misma firma y mismo shape de salida que `useFetchDatosEntidadRelacionada`
 * (v2), pero consume el endpoint `appweb` en lugar de `clientes/api/v2`.
 *
 * @param {Object} params - Parámetros de búsqueda (ej: { entidad_id, cod_estado })
 * @param {Object} options - Opciones adicionales de useQuery
 * @returns {UseQueryResult} Query result con array de entidades relacionadas
 *   con el mismo shape que la versión v2.
 */
export function useFetchDatosEntidadRelacionadaV1(params = {}, options = {}) {
  const entidadIdConsulta = params?.entidad_id != null && params.entidad_id !== ""
    ? Number(params.entidad_id)
    : null;

  return useQuery({
    queryKey: ["datos-entidad-relacionada-appweb", params],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-entidad-relacion", {
        params,
      });

      const list =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data ||
        [];
      const listArr = Array.isArray(list) ? list : [];

      const data = listArr
        .map((row) => mapRelacionToEntidad(row, entidadIdConsulta))
        .filter(Boolean);

      return {
        success: true,
        cod_mensaje: null,
        data,
      };
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
