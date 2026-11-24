import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { extractResponseData, CACHE_STATIC } from "../utils";

/**
 * Hook público para obtener lista de tipos por tabla.
 * GET /clientes/api/v2/lista-tipo?tipo_tabla=
 * Headers Authorization y version_app los inyecta el interceptor de api_no_auth_v2.
 * Data pública: el token NO forma parte del queryKey.
 *
 * @param {string} tipoTabla
 * @returns {UseQueryResult} Query result con tipos mapeados
 */
export function useFetchTiposPublico(tipoTabla = "") {
  return useQuery({
    queryKey: ["tipos-publico", tipoTabla],
    queryFn: async () => {
      const response = await api_no_auth_v2.get("/clientes/api/v2/lista-tipo", {
        params: { tipo_tabla: tipoTabla },
      });

      return extractResponseData(response).map((t) => ({
        cod_tipo: t.COD_TIPO ?? t.cod_tipo,
        nom_tipo: t.NOM_TIPO ?? t.nom_tipo,
        tipo_tabla: t.TIPO_TABLA ?? t.tipo_tabla,
        cod_estado: t.COD_ESTADO ?? t.cod_estado,
        estado_desc: t.ESTADO_DESC ?? t.estado_desc,
        cod_tipo_dato: t.COD_TIPO_DATO ?? t.cod_tipo_dato,
        nomenclatura: t.NOMENCLATURA ?? t.nomenclatura,
      }));
    },
    ...CACHE_STATIC,
  });
}
