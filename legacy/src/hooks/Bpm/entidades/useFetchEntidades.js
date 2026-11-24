import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

/**
 * Hook para obtener lista de entidades
 *
 * Entre las propiedades que se pueden enviar en `filters` están:
 *
 * Nombre           | Requerido | Tipo     | Descripción
 * ---------------- | --------- | -------- | ---------------------------------------------------------
 * `tipo_entidad`   | SI        | TEXTO    | Tipo de entidad a recuperar. Valores permitidos: PROVEEDOR, CLIENTE, DSV, PRE-CLIENTE, CONSIGNATARIO
 * `cod_industria`  | NO        | NUMÉRICO | Código de la industria — puede obtenerse del listado industria.
 * `cod_pais`       | NO        | NUMÉRICO | Código del país — puede obtenerse del listado Pais.
 * `cod_ciudad`     | NO        | NUMÉRICO | Código de la ciudad — puede obtenerse del listado ciudad.
 * `entidad_id`     | NO        | NUMÉRICO | ID de la entidad para filtrar resultados (obtenible desde el listado de entidades).
 * `nopagina`       | NO        | NUMÉRICO | Página solicitada (paginación). Opcional — usar si aplica paginado.
 * `cod_estado`     | NO        | NUMÉRICO | Estado del registro (ej. activo/inactivo).
 *
 * @param {Object} filters - Filtros opcionales (ver propiedades arriba)
 * @param {Object} options - Opciones de react-query
 * @returns {UseQueryResult} Query result con entidades mapeadas
 */
export function useFetchEntidades(filters = {}, options = {}) {
  const effectiveFilters =
    typeof filters === "string"
      ? { tipo_entidad: filters }
      : filters || {};

  const token = getAuthToken();

  return useQuery({
    queryKey: ["entidades", effectiveFilters, token],
    queryFn: async () => {
      const response = await api.get("/api/appweb/lista-entidad", {
        params: effectiveFilters,
      });
      return extractResponseData(response).map((ent) => ({
        codigo_entidad: ent.CODIGO_ENTIDAD ?? ent.codigo_entidad,
        entidad_id: ent.ENTIDAD_ID ?? ent.entidad_id,
        entidad_nombre: ent.ENTIDAD_NOMBRE ?? ent.entidad_nombre,
        cod_tipo: ent.COD_TIPO ?? ent.cod_tipo,
        tipo_descripcion: ent.TIPO_DESCRIPCION ?? ent.tipo_descripcion,
        entidad_clasificacion: ent.ENTIDAD_CLASIFICACION ?? ent.entidad_clasificacion,
        cod_industria: ent.COD_INDUSTRIA ?? ent.cod_industria,
        nom_industria_es: ent.NOM_INDUSTRIA_ES ?? ent.nom_industria_es,
        cod_pais: ent.COD_PAIS ?? ent.cod_pais,
        nombre_pais: ent.NOMBRE_PAIS ?? ent.nombre_pais,
        cod_ciudad: ent.COD_CIUDAD ?? ent.cod_ciudad,
        nombre_ciudad: ent.NOMBRE_CIUDAD ?? ent.nombre_ciudad,
        moneda_credito_desc: ent.MONEDA_CREDITO_DESC ?? ent.moneda_credito_desc,
        moneda_credito_simbolo: ent.MONEDA_CREDITO_SIMBOLO ?? ent.moneda_credito_simbolo,
        cod_estado: ent.COD_ESTADO ?? ent.cod_estado,
        estado_desc: ent.ESTADO_DESC ?? ent.estado_desc,
        limite_credito: ent.LIMITE_CREDITO ?? ent.limite_credito,
        cod_moneda_credito: ent.COD_MONEDA_CREDITO ?? ent.cod_moneda_credito,
        utilizacion_credito: ent.UTILIZACION_CREDITO ?? ent.utilizacion_credito,
      }));
    },
    ...CACHE_SEMI_STATIC,
    placeholderData: undefined,
    ...options,
  });
}
