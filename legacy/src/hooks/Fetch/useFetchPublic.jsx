import { api_no_auth } from "../../api";
import api_no_auth_v2 from "../Bpm/utils/apiPublic";
import useCustomQuery from "./useCustomQuery";

const defaultOptions = {
  staleTime: 1000 * 60 * 10,
};

// Los headers Authorization (public_token) y version_app (public_version_app)
// los inyecta el interceptor request de api_no_auth desde localStorage.
// No seteamos headers per-call.

const getDataHook = (endpoint, params, mapper) =>
  () =>
    api_no_auth
      .get(endpoint, { params })
      .then(({ data }) => {
        if (!data.data || (typeof data.data === "object" && data.data.success === false)) {
          return [];
        }
        return mapper ? data.data.map(mapper) : data.data;
      })
      .catch(() => []);

const createPublicDataHook =
  (key, endpoint, mapper = (e) => e) =>
  (params = {}, options = {}) =>
    useCustomQuery([key, params], getDataHook(endpoint, params, mapper), { ...defaultOptions, ...options });

export const useFetchPaisesPublic = createPublicDataHook(
  ["paises-public"],
  "/clientes/api/listapaises",
  (p) => ({ ...p, label: p.NOMBRE_PAIS || p.nombre_pais, value: p.COD_PAIS || p.cod_pais }),
);

export const useFetchCiudadesPublic = createPublicDataHook(
  ["ciudades-public"],
  "/clientes/api/lista-ciudad",
  (c) => ({ ...c, label: c.NOMBRE_CIUDAD || c.nombre_ciudad, value: c.COD_CIUDAD || c.cod_ciudad }),
);

export const useFetchMonedasPublic = createPublicDataHook(
  ["monedas-public"],
  "/clientes/api/lista-moneda",
  (i) => ({
    ...i,
    label: i.NOM_MONEDA || i.nom_moneda,
    value: i.COD_MONEDA || i.cod_moneda,
    simbolo_moneda: i.SIMBOLO_MONEDA || i.simbolo_moneda,
    SIMBOLO_MONEDA: i.SIMBOLO_MONEDA || i.simbolo_moneda,
  }),
);

export const useFetchRubrosPublic = createPublicDataHook(
  ["rubros-public"],
  "/clientes/api/lista-rubros",
  (r) => ({
    ...r,
    label: r.NOMBRE || r.nombre || r.NOM_RUBRO || r.nom_rubro || String(r.COD_RUBRO || r.cod_rubro || r.ID || r.id),
    value: r.COD_RUBRO || r.cod_rubro || r.ID || r.id,
    raw: r,
  }),
);

export const useFetchUnidadesMedidaPublic = (options = {}) => {
  return useCustomQuery(
    ["unidades-medida-public"],
    () =>
      api_no_auth
        .get("/clientes/api/lista-tipo", {
          params: { tipo_tabla: "coordinacion_carga" },
        })
        .then(({ data }) => {
          if (!data.data || (typeof data.data === "object" && data.data.success === false)) return [];
          if (!Array.isArray(data.data)) return [];
          return data.data.map((tipo) => ({
            value: tipo.COD_TIPO || tipo.cod_tipo,
            label: tipo.NOM_TIPO || tipo.nom_tipo,
          }));
        })
        .catch(() => []),
    { ...defaultOptions, ...options },
  );
};

export const useFetchTiposPublic = (tipo_tabla = "", params = {}, options = {}) => {
  return useCustomQuery(
    ["tipos-public", tipo_tabla, params],
    () =>
      api_no_auth
        .get("/clientes/api/lista-tipo", {
          params: { tipo_tabla, ...params },
        })
        .then(({ data }) => {
          if (!data.data || (typeof data.data === "object" && data.data.success === false)) return [];
          if (!Array.isArray(data.data)) return [];
          return data.data.map((tipo) => ({
            ...tipo,
            label: tipo.NOM_TIPO || tipo.nom_tipo || tipo.nombre || tipo.NOMBRE || String(tipo.COD_TIPO || tipo.cod_tipo || tipo.ID || tipo.id),
            value: tipo.COD_TIPO || tipo.cod_tipo || tipo.ID || tipo.id,
          }));
        })
        .catch(() => []),
    { ...defaultOptions, ...options },
  );
};

export const useFetchTiposTransportePublic = (params = {}, options = {}) => {
  return useCustomQuery(
    ["tipos-transporte-public", params],
    () =>
      api_no_auth
        .get("/clientes/api/lista-tipo", {
          params: { tipo_tabla: "TRANSPORTE", ...params },
        })
        .then(({ data }) => {
          if (!data.data || (typeof data.data === "object" && data.data.success === false)) return [];
          if (!Array.isArray(data.data)) return [];
          return data.data.map((t) => ({
            ...t,
            label: t.NOM_TIPO || t.nom_tipo,
            value: t.COD_TIPO || t.cod_tipo,
          }));
        })
        .catch(() => []),
    { ...defaultOptions, ...options },
  );
};

export const useFetchRelacionesTiposPublic = (params = {}, options = {}) => {
  return useCustomQuery(
    ["relaciones-tipos-public", params],
    () =>
      api_no_auth
        .get("/clientes/api/lista-relacion-tipo", {
          params: { tipo_tabla: "SERVICIO", ...params },
        })
        .then(({ data }) => {
          if (!data.data || (typeof data.data === "object" && data.data.success === false)) return [];
          if (!Array.isArray(data.data)) return [];
          return data.data.map((r) => ({
            ...r,
            label: r.NOM_TIPO || r.nom_tipo,
            value: r.COD_TIPO || r.cod_tipo,
          }));
        })
        .catch(() => []),
    { ...defaultOptions, ...options },
  );
};

export const useFetchIncotermsPublic = createPublicDataHook(
  ["incoterms-public"],
  "/clientes/api/lista-incoterm",
  (i) => ({
    ...i,
    label: `${i.codigo || i.CODIGO} - ${i.nombre_eng || i.NOMBRE_ENG} ( ${i.nombre || i.NOMBRE} )`,
    value: i.incoterm_id || i.INCOTERM_ID,
  }),
);

export const useFetchIncotermsPublicV2 = (params = {}, options = {}) => {
  return useCustomQuery(
    ["incoterms-public-v2", params],
    () =>
      api_no_auth_v2
        .get("/clientes/api/v2/lista-incoterm", { params })
        .then(({ data }) => {
          if (!data.data || (typeof data.data === "object" && data.data.success === false)) return [];
          return data.data.map((i) => ({
            ...i,
            label: `${i.codigo || i.CODIGO} - ${i.nombre_eng || i.NOMBRE_ENG} ( ${i.nombre || i.NOMBRE} )`,
            value: i.incoterm_id || i.INCOTERM_ID,
          }));
        })
        .catch(() => []),
    { ...defaultOptions, ...options },
  );
};
