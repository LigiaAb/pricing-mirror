import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";
import { createDataMutationHook } from "../../Fetch/useFunctions";

/**
 * Hook para obtener lista de relacion-tipo (mapea a { label, value })
 * @param {Object} filters - Filtros opcionales (ej: tipo_tabla, tipo_padre_tabla)
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con relaciones mapeadas
 */
export function useFetchRelacionTipo(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["relacion-tipo", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-relacion-tipo", {
        params: filters,
      });
      return extractResponseData(response).map((r) => ({
        // keep both identifiers available for consumers
        cod_relacion_tipo: r.COD_RELACION_TIPO ?? r.cod_relacion_tipo,
        cod_tipo: r.COD_TIPO ?? r.cod_tipo ?? r.codTipo,
        tipo_desc: r.TIPO_DESC ?? r.tipo_desc ?? r.tipoDesc,
        tipo_tabla: r.TIPO_TABLA ?? r.tipo_tabla ?? r.tipoTabla,
        tipo_padre_tabla: r.TIPO_PADRE_TABLA ?? r.tipo_padre_tabla ?? r.tipoPadreTabla,
        // prefer to expose the relation id as the option value; older
        // code may still read cod_tipo if necessary
        value:
          r.COD_RELACION_TIPO ??
          r.cod_relacion_tipo ??
          r.COD_TIPO ??
          r.cod_tipo ??
          r.codTipo,
        label: r.TIPO_DESC ?? r.tipo_desc ?? r.tipoDesc,
      }));
    },
    ...CACHE_SEMI_STATIC,
    ...options,
  });
}

// ----------------------------------------------------------------------------
// Mutations for relacion-tipo (insert / update / delete)
// These endpoints use a simple POST payload as described in the API
// specification; the hooks just call the endpoint and return the raw
// response.  Payload attributes are documented for consumer reference.
//
// - POST /api/appweb/insertar-relacion-tipo
// - POST /api/appweb/actualizar-relacion-tipo
// - POST /api/appweb/eliminar-relacion-tipo
//
// Atributos
// NOMBRE               OBLIGATORIO  TIPO      TAMAÑO  DESCRIPCIÓN
// cod_relacion_tipo    SI           Numerico  1-5     Requerido al actualizar y eliminar.
// cod_tipo             SI           Numerico  1-5     Requerido al insertar actualizar y eliminar.
// cod_tipo_padre       SI           Numerico  1-5     Requerido al insertar y actualizar.
// fecha_inicio         NO           YYYY-MM-DD 15    Opcional. Será llenado de manera automatica con la fecha actual al ser creado.
// fecha_fin            NO           YYYY-MM-DD 15    Opcional. Se recomienda llenar enviar la fecha actual cuando se realice una eliminacion logica.
// cod_estado           SI           Numero     1-3    Requerido al insertar y actualizar.

export const useInsertarRelacionTipo = createDataMutationHook(
  ["relacion-tipo-insert"],
  "/api/appweb/insertar-relacion-tipo",
  (res) => res,
);

export const useActualizarRelacionTipo = createDataMutationHook(
  ["relacion-tipo-update"],
  "/api/appweb/actualizar-relacion-tipo",
  (res) => res,
);

export const useEliminarRelacionTipo = createDataMutationHook(
  ["relacion-tipo-delete"],
  "/api/appweb/eliminar-relacion-tipo",
  (res) => res,
);

