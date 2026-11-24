import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { CACHE_SEMI_STATIC } from "../utils";

// Los headers Authorization y version_app los inyecta el interceptor de api_no_auth_v2
// desde localStorage (public_token / public_version_app). No se setean per-call.

export function useFetchRelacionTipoPublicV2(params = {}, options = {}) {
  return useQuery({
    queryKey: ["lista-relacion-tipo-v2", params],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/lista-relacion-tipo", { params });
      const data = response.data?.data;
      if (!Array.isArray(data)) return [];
      return data.map((r) => ({
        codRelacionTipo: r.COD_RELACION_TIPO ?? r.cod_relacion_tipo,
        codTipo: r.COD_TIPO ?? r.cod_tipo,
        value: r.COD_RELACION_TIPO ?? r.cod_relacion_tipo ?? r.COD_TIPO ?? r.cod_tipo,
        label: r.TIPO_DESC ?? r.tipo_desc ?? r.NOM_TIPO ?? r.nom_tipo ?? "",
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}

export function useFetchTiposV2(tipo_tabla = "", options = {}) {
  return useQuery({
    queryKey: ["lista-tipo-v2", tipo_tabla],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/lista-tipo", {
        params: { tipo_tabla },
      });

      const data = response.data?.data;
      if (!Array.isArray(data)) return [];

      return data.map((t) => ({
        codTipo: t.COD_TIPO || t.cod_tipo,
        nomTipo: t.NOM_TIPO || t.nom_tipo,
        tipoTabla: t.TIPO_TABLA || t.tipo_tabla,
        codEstado: t.COD_ESTADO || t.cod_estado,
        estadoDesc: t.ESTADO_DESC || t.estado_desc,
        codTipoDato: t.COD_TIPO_DATO || t.cod_tipo_dato,
        nomenclatura: t.NOMENCLATURA || t.nomenclatura,
        value: t.COD_TIPO || t.cod_tipo,
        label: t.NOM_TIPO || t.nom_tipo,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}
