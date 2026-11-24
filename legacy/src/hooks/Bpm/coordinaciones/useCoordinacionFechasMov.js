import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_DYNAMIC } from "../utils";

/**
 * Hook para obtener fechas/movimientos de coordinación (con filtros generales)
 * @param {Object} filters - Filtros opcionales
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con fechas/movimientos mapeados
 */
export function useFetchCoordinacionFechaMov(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["coordinacion-fecha-mov", filters],
    queryFn: async () => {
      const response = await api.get("/api/appweb/listar-coordinacion-fecha-mov", {
        params: filters,
      });
      return extractResponseData(response).map((it) => ({
        // Uppercase keys for backward compatibility
        ID_FECHA_REG_EMBARQUE: it.ID_FECHA_REG_EMBARQUE || it.id_fecha_reg_embarque,
        EMBARQUE_ID: it.EMBARQUE_ID || it.embarque_id,
        COD_FILE: it.COD_FILE || it.cod_file,
        EMB_LEGS_ID: it.EMB_LEGS_ID || it.emb_legs_id,
        ID_FECHA_TIPO: it.ID_FECHA_TIPO || it.id_fecha_tipo,
        TIPO_DESCRIPCION: it.TIPO_DESCRIPCION || it.tipo_descripcion,
        NOMENCLATURA: it.NOMENCLATURA || it.nomenclatura,
        FECHA: it.FECHA || it.fecha,
        USUARIO_ID: it.USUARIO_ID || it.usuario_id,
        USUARIO_CREA: it.USUARIO_CREA || it.usuario_crea,
        OBSERVACION: it.OBSERVACION || it.observacion,
        ESTADO_ID: it.ESTADO_ID || it.estado_id,
        ESTADO_DESCRIPCION: it.ESTADO_DESCRIPCION || it.estado_descripcion,
        // camelCase aliases
        idFechaRegEmbarque: it.ID_FECHA_REG_EMBARQUE || it.id_fecha_reg_embarque,
        embarqueId: it.EMBARQUE_ID || it.embarque_id,
        nomenclatura: it.NOMENCLATURA || it.nomenclatura,
        fecha: it.FECHA || it.fecha,
        observacion: it.OBSERVACION || it.observacion,
        estadoDescripcion: it.ESTADO_DESCRIPCION || it.estado_descripcion,
      }));
    },
    ...CACHE_DYNAMIC,
    ...options,
  });
}

/**
 * Hook para obtener fechas/movimientos de una coordinación específica
 * @param {{ cod_coordinacion: string|number }} params - Código de coordinación
 * @param {Object} options - Opciones adicionales de React Query
 * @returns {UseQueryResult} Query result con fechas/movimientos mapeados
 */
export function useCoordinacionFechasMov({ cod_coordinacion }, options = {}) {
  return useQuery({
    queryKey: ["coordinacion-fechas-mov", cod_coordinacion],
    queryFn: async () => {
      const { data } = await api.get("/api/appweb/listar-coordinacion-fecha-mov", {
        params: { cod_coordinacion },
      });
      return (Array.isArray(data) ? data : []).map((item) => ({
        movimiento: item.movimiento_id,
        movimientoNombre: item.movimiento_nombre,
        fecha: item.movimiento_fecha,
        monto: item.movimiento_monto,
        tipo: item.movimiento_tipo,
        usuarioCreacion: item.usuario_creacion,
        fechaCreacion: item.fecha_creacion,
        usuarioModificacion: item.usuario_modificacion,
        fechaModificacion: item.fecha_modificacion,
      }));
    },
    enabled: !!cod_coordinacion,
    ...CACHE_DYNAMIC,
    ...options,
  });
}
