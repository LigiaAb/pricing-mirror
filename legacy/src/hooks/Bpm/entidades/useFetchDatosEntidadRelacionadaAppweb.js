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

const mapNombre = (n) => ({
  entidadnombre_id: pick(n, "entidadnombre_id", "ENTIDADNOMBRE_ID"),
  codigo_entidad: pick(n, "codigo_entidad", "CODIGO_ENTIDAD"),
  entidad_nombre: pick(n, "entidad_nombre", "ENTIDAD_NOMBRE"),
  entidad_id: pick(n, "entidad_id", "ENTIDAD_ID"),
  entidadnombre_nombre: pick(n, "entidadnombre_nombre", "ENTIDADNOMBRE_NOMBRE"),
  cod_tipo: pick(n, "cod_tipo", "COD_TIPO"),
  tipo_descripcion: pick(n, "tipo_descripcion", "TIPO_DESCRIPCION"),
  cod_estado: pick(n, "cod_estado", "COD_ESTADO"),
  estado_desc: pick(n, "estado_desc", "ESTADO_DESC"),
  cod_pais: pick(n, "cod_pais", "COD_PAIS"),
  nombre_pais: pick(n, "nombre_pais", "NOMBRE_PAIS"),
});

const mapIdentificacion = (i) => ({
  entidadidentificacion_id: pick(i, "entidadidentificacion_id", "ENTIDADIDENTIFICACION_ID"),
  codigo_entidad: pick(i, "codigo_entidad", "CODIGO_ENTIDAD"),
  entidad_id: pick(i, "entidad_id", "ENTIDAD_ID"),
  entidad_nombre: pick(i, "entidad_nombre", "ENTIDAD_NOMBRE"),
  cod_identificacion: pick(i, "cod_identificacion", "COD_IDENTIFICACION"),
  nom_identificacion: pick(i, "nom_identificacion", "NOM_IDENTIFICACION"),
  entidadidentificacio_numero: pick(i, "entidadidentificacio_numero", "ENTIDADIDENTIFICACIO_NUMERO"),
  cod_estado: pick(i, "cod_estado", "COD_ESTADO"),
  estado_desc: pick(i, "estado_desc", "ESTADO_DESC"),
  entidadidentificacion_fecha_inicio: pick(i, "entidadidentificacion_fecha_inicio", "ENTIDADIDENTIFICACION_FECHA_INICIO"),
  entidadidentificacion_fecha_fin: pick(i, "entidadidentificacion_fecha_fin", "ENTIDADIDENTIFICACION_FECHA_FIN"),
  entidadidentificacion_ruta: pick(i, "entidadidentificacion_ruta", "ENTIDADIDENTIFICACION_RUTA"),
});

const mapContacto = (c) => ({
  entidadcontacto_id: pick(c, "entidadcontacto_id", "ENTIDADCONTACTO_ID"),
  codigo_entidad: pick(c, "codigo_entidad", "CODIGO_ENTIDAD"),
  entidad_nombre: pick(c, "entidad_nombre", "ENTIDAD_NOMBRE"),
  entidad_id: pick(c, "entidad_id", "ENTIDAD_ID"),
  cod_emp: pick(c, "cod_emp", "COD_EMP"),
  cod_cc: pick(c, "cod_cc", "COD_CC"),
  nombre_emp: pick(c, "nombre_emp", "NOMBRE_EMP"),
  nombre_cc: pick(c, "nombre_cc", "NOMBRE_CC"),
  entidadcontacto_nombre: pick(c, "entidadcontacto_nombre", "ENTIDADCONTACTO_NOMBRE"),
  entidadcontacto_email: pick(c, "entidadcontacto_email", "ENTIDADCONTACTO_EMAIL"),
  entidadcontacto_telefono: pick(c, "entidadcontacto_telefono", "ENTIDADCONTACTO_TELEFONO"),
  cod_estado: pick(c, "cod_estado", "COD_ESTADO"),
  estado_desc: pick(c, "estado_desc", "ESTADO_DESC"),
  data_entidad_contacto_tipo: (() => {
    const raw = pick(c, "data_entidad_contacto_tipo", "DATA_ENTIDAD_CONTACTO_TIPO");
    if (!raw) return [];
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return raw;
  })(),
});

const mapDireccion = (d) => ({
  entidaddireccion_id: pick(d, "entidaddireccion_id", "ENTIDADDIRECCION_ID"),
  codigo_entidad: pick(d, "codigo_entidad", "CODIGO_ENTIDAD"),
  entidad_nombre: pick(d, "entidad_nombre", "ENTIDAD_NOMBRE"),
  entidad_id: pick(d, "entidad_id", "ENTIDAD_ID"),
  cod_tipo: pick(d, "cod_tipo", "COD_TIPO"),
  tipo_descripcion: pick(d, "tipo_descripcion", "TIPO_DESCRIPCION"),
  entidaddireccion_direccion: pick(d, "entidaddireccion_direccion", "ENTIDADDIRECCION_DIRECCION"),
  entidaddireccion_zona: pick(d, "entidaddireccion_zona", "ENTIDADDIRECCION_ZONA"),
  entidaddireccion_km: pick(d, "entidaddireccion_km", "ENTIDADDIRECCION_KM"),
  cod_muni: pick(d, "cod_muni", "COD_MUNI"),
  nombre_muni: pick(d, "nombre_muni", "NOMBRE_MUNI"),
  cod_depto: pick(d, "cod_depto", "COD_DEPTO"),
  nombre_depto: pick(d, "nombre_depto", "NOMBRE_DEPTO"),
  cod_pais: pick(d, "cod_pais", "COD_PAIS"),
  nombre_pais: pick(d, "nombre_pais", "NOMBRE_PAIS"),
  cod_estado: pick(d, "cod_estado", "COD_ESTADO"),
  estado_desc: pick(d, "estado_desc", "ESTADO_DESC"),
});

const mapEntidadRelacionada = (e) => ({
  entidad_id: pick(e, "entidad_id", "ENTIDAD_ID"),
  cod_tipo: pick(e, "cod_tipo", "COD_TIPO"),
  cod_tipo_relacion: pick(e, "cod_tipo_relacion", "COD_TIPO_RELACION"),
  descripcion_tipo_relacion: pick(e, "descripcion_tipo_relacion", "DESCRIPCION_TIPO_RELACION"),
  codigo_entidad: pick(e, "codigo_entidad", "CODIGO_ENTIDAD"),
  entidad_nombre: pick(e, "entidad_nombre", "ENTIDAD_NOMBRE"),
  tipo_descripcion: pick(e, "tipo_descripcion", "TIPO_DESCRIPCION"),
  entidad_clasificacion: pick(e, "entidad_clasificacion", "ENTIDAD_CLASIFICACION"),
  cod_industria: pick(e, "cod_industria", "COD_INDUSTRIA"),
  nom_industria_es: pick(e, "nom_industria_es", "NOM_INDUSTRIA_ES"),
  cod_pais: pick(e, "cod_pais", "COD_PAIS"),
  nombre_pais: pick(e, "nombre_pais", "NOMBRE_PAIS"),
  cod_ciudad: pick(e, "cod_ciudad", "COD_CIUDAD"),
  nombre_ciudad: pick(e, "nombre_ciudad", "NOMBRE_CIUDAD"),
  cod_estado: pick(e, "cod_estado", "COD_ESTADO"),
  estado_desc: pick(e, "estado_desc", "ESTADO_DESC"),
  limite_credito: pick(e, "limite_credito", "LIMITE_CREDITO"),
  cod_moneda_credito: pick(e, "cod_moneda_credito", "COD_MONEDA_CREDITO"),
  utilizacion_credito: pick(e, "utilizacion_credito", "UTILIZACION_CREDITO"),
  moneda_credito_desc: pick(e, "moneda_credito_desc", "MONEDA_CREDITO_DESC"),
  moneda_credito_simbolo: pick(e, "moneda_credito_simbolo", "MONEDA_CREDITO_SIMBOLO"),
  data_nombres: (pick(e, "data_nombres", "DATA_NOMBRES") || []).map(mapNombre),
  data_identificaciones: (pick(e, "data_identificaciones", "DATA_IDENTIFICACIONES") || []).map(mapIdentificacion),
  data_contactos: (pick(e, "data_contactos", "DATA_CONTACTOS") || []).map(mapContacto),
  data_direcciones: (pick(e, "data_direcciones", "DATA_DIRECCIONES") || []).map(mapDireccion),
});

export function useFetchDatosEntidadRelacionadaAppweb(params = {}, options = {}) {
  return useQuery({
    queryKey: ["datos-entidad-relacionada-appweb", params],
    queryFn: async () => {
      const response = await api.get("/api/appweb/recuperar-datos-entidad-relacionada", {
        params,
      });

      const responseData = response?.data?.data || {};

      return {
        success: responseData.success,
        cod_mensaje: responseData.cod_mensaje,
        data: (responseData.data || []).map(mapEntidadRelacionada),
      };
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
