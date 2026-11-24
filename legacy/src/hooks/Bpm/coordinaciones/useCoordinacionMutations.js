import { createDataMutationHook } from "../../Fetch/useFunctions";
import useCustomMutation from "../../Fetch/useCustomMutation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";

// ============================================================================
// COORDINACIÓN - CRUD PRINCIPAL
// ============================================================================

/**
 * Hook para crear una coordinación
 * @payload {
 *   cod_empresa: number (1-6, obligatorio),
 *   cod_cc: number (1-6, obligatorio),
 *   cod_tipo_embarque: number (1-6, obligatorio),
 *   cod_entidad_cli: number (1-6, obligatorio),
 *   cod_pais_origen: number (1-6, obligatorio),
 *   cod_pais_destino: number (1-6, obligatorio),
 *   puerto_id_origen: number (1-6, obligatorio),
 *   puerto_id_destino: number (1-6, obligatorio),
 *   cod_servicio: number (1-6, obligatorio),
 *   cod_tipo_carga: number (1-6, obligatorio),
 *   cod_cotizacion_cabecera: number (1-6, obligatorio),
 *   char_w: number (peso cobrable - CW, obligatorio),
 *   cod_entidad_shipper: number (1-6, opcional),
 *   cod_entidad_consignatario: number (1-6, opcional),
 *   incoterm_id?: number (1-6, opcional),
 *   cod_tipo_pago?: number (1-6, opcional),
 *   cod_asesor?: number (1-6, opcional),
 *   observacion?: string (75 chars, opcional),
 *   cod_embarque_padre?: number (1-6, opcional)
 * }
 */
export const useCreateCoordinacion = createDataMutationHook(
  ["coordinacion"],
  "/api/appweb/insertar-coordinacion",
  (res) => res,
);

/**
 * Hook para actualizar una coordinación
 * @payload {
 *   embarque_id: number (1-10, obligatorio),
 *   cod_file: string (10 chars, obligatorio),
 *   cod_empresa: number (1-6, obligatorio),
 *   cod_cc: number (1-6, obligatorio),
 *   cod_tipo_embarque: number (1-6, obligatorio),
 *   cod_entidad_cli: number (1-6, obligatorio),
 *   cod_pais_origen: number (1-6, obligatorio),
 *   cod_pais_destino: number (1-6, obligatorio),
 *   puerto_id_origen: number (1-6, obligatorio),
 *   puerto_id_destino: number (1-6, obligatorio),
 *   cod_servicio: number (1-6, obligatorio),
 *   cod_tipo_carga: number (1-6, obligatorio),
 *   cod_cotizacion_cabecera: number (1-6, obligatorio),
 *   char_w: number (peso cobrable - CW, obligatorio),
 *   incoterm_id?: number (1-6, opcional),
 *   cod_tipo_pago?: number (1-6, opcional),
 *   cod_asesor?: number (1-6, opcional),
 *   observacion?: string (75 chars, opcional),
 *   cod_embarque_padre?: number (1-6, opcional)
 * }
 *
 * Nota: Although the UI displays a "cliente" field in the Facturación form,
 * that value is not part of the payload and is ignored by the API.  It is
 * included only for user reference and must never be sent here.
 */
export const useUpdateCoordinacion = (params, options = {}) => {
  const queryClient = useQueryClient();

  return createDataMutationHook(
    ["coordinacion-update"],
    "/api/appweb/actualizar-coordinacion",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (newData, variables, context) => {
      // invalidar listas generales tras actualizar una coordinación
      queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });

      // si el payload incluye embarque_id también refrescamos la info especifica
      const payload = variables || {};
      const embarqueId =
        payload.embarque_id || payload?.EMBARQUE_ID || payload?.embarqueId || null;
      if (embarqueId) {
        queryClient.invalidateQueries({ queryKey: ["embarque-info", String(embarqueId)] });
        queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", String(embarqueId)] });
      }

      if (options.onSuccess) options.onSuccess(newData, variables, context);
    },
  });
};

// ============================================================================
// REPESO DE CARGA
// ============================================================================

/**
 * Hook para crear registros de repeso de carga
 * @returns {UseMutationResult} Mutation hook
 */
export const useCreateRepesoCarga = createDataMutationHook(
  ["repeso-carga"],
  "/api/appweb/repeso-carga",
  (res) => res,
);

// ============================================================================
// COORDINACIÓN - CARGAS
// ============================================================================

/**
 * Hook BPM para insertar una carga en la coordinación
 * Endpoint: POST /api/appweb/insertar-coordinacion-carga
 * Payload: ver esquema de `embarque` / `carga` (embarque_id, rubro_id?, bultos, tipo_unidad, peso, volumen, char_w?, etc.)
 * Nota: `rubro_id` y `char_w` (CW) son opcionales — el frontend puede omitirlos.
 * Se aceptan los nuevos campos de dimensión: `largo`, `alto`, `ancho` (en cm).
 * Importante: las claves del payload deben enviarse en minúsculas (ej.: `bultos`, `descripcion_carga`, `emb_carga_id`).
 */
export const useInsertarCoordinacionCarga = (params, options = {}) => {
  const queryClient = useQueryClient();

  return createDataMutationHook(
    ["coordinacion-cargas"],
    "/api/appweb/insertar-coordinacion-carga",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas"] });
      queryClient.invalidateQueries({ queryKey: ["coordinacion-carga"] });
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

/**
 * Hook BPM para actualizar una carga de coordinación
 * Endpoint: POST /api/appweb/actualizar-coordinacion-carga
 * Nota: `rubro_id` y `char_w` (CW) son opcionales en el payload.
 * Se aceptan los nuevos campos de dimensión: `largo`, `alto`, `ancho` (en cm).
 * Importante: las claves del payload deben enviarse en minúsculas (ej.: `bultos`, `descripcion_carga`, `emb_carga_id`).
 */
export const useActualizarCoordinacionCarga = (params, options = {}) => {
  const queryClient = useQueryClient();

  return createDataMutationHook(
    ["coordinacion-cargas"],
    "/api/appweb/actualizar-coordinacion-carga",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas"] });
      queryClient.invalidateQueries({ queryKey: ["coordinacion-carga"] });
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

/**
 * Hook BPM para eliminar una carga de coordinación
 * Endpoint: POST /api/appweb/eliminar-coordinacion-carga
 * @payload { embarque_id, emb_carga_id }
 *
 * Nota: el parámetro `params` se usa para construir la clave de caché
 * utilizada por react-query. Al crear el hook se debe pasar el
 * `embarque_id` correspondiente para que la invalidación/optimismo
 * funcione correctamente:
 *
 *   const { mutateAsync } = useEliminarCoordinacionCarga({ embarque_id });
 */
export const useEliminarCoordinacionCarga = (params, options = {}) => {
  const queryClient = useQueryClient();

  return createDataMutationHook(
    ["coordinacion-cargas"],
    "/api/appweb/eliminar-coordinacion-carga",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas"] });
      queryClient.invalidateQueries({ queryKey: ["coordinacion-carga"] });
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

// ============================================================================
// COORDINACIÓN - FECHAS Y MOVIMIENTOS
// ============================================================================

/**
 * Hook para crear una fecha de coordinación de movimiento
 * @payload { embarqueId, id_tipo_fecha, observacion, fecha, estado_cod }
 */
export const useCreateCoordinacionFechaMov = createDataMutationHook(
  ["coordinacion-fecha-mov"],
  "/api/appweb/insertar-coordinacion-fecha-mov",
  (res) => res,
);

/**
 * Hook para actualizar una fecha de coordinación de movimiento
 * @payload { id_fecha_reg_embarque, embarque_id, id_tipo_fecha, observacion, fecha, estado_cod }
 */
export const useUpdateCoordinacionFechaMov = createDataMutationHook(
  ["coordinacion-fecha-mov-update"],
  "/api/appweb/actualizar-coordinacion-fecha-mov",
  (res) => res,
);

/**
 * Hook para eliminar una fecha de coordinación de movimiento
 * @payload { id_fecha_reg_embarque }
 */
export const useDeleteCoordinacionFechaMov = createDataMutationHook(
  ["coordinacion-fecha-mov-delete"],
  "/api/appweb/eliminar-coordinacion-fecha-mov",
  (res) => res,
);

// ============================================================================
// COORDINACIÓN - DOCUMENTOS
// ============================================================================

/**
 * Hook para insertar un documento relacionado a una coordinación
 * @payload { embarque_id, cod_tipo_documento, ubicacion, url_archivo, descripcion, estado_cod, documento_id_coord? }
 */
export const useCreateCoordinacionDocumento = createDataMutationHook(
  ["coordinacion-documento"],
  "/api/appweb/insertar-coordinacion-documento",
  (res) => res,
);

/**
 * Hook para actualizar un documento de coordinación
 * @payload { documento_id_coord, embarque_id, cod_tipo_documento, ubicacion, url_archivo, descripcion, estado_cod }
 */
export const useUpdateCoordinacionDocumento = createDataMutationHook(
  ["coordinacion-documento-update"],
  "/api/appweb/actualizar-coordinacion-documento",
  (res) => res,
);

/**
 * Hook para eliminar un documento de coordinación
 * @payload { documento_id_coord }
 */
export const useDeleteCoordinacionDocumento = createDataMutationHook(
  ["coordinacion-documento-delete"],
  "/api/appweb/eliminar-coordinacion-documento",
  (res) => res,
);

// ============================================================================
// ATD (Hora real de salida) - actualización especializada
// ============================================================================
/**
 * Hook para actualizar la fecha ATD asociada a una coordinación (combex)
 * @payload { embarque_id?, cod_file?, fecha_atd }
 */
export const useUpdateAtdCoordinacionAsignada = createDataMutationHook(
  ["coordinacion-atd-update"],
  "/api/appweb/actualizar-atd-coordinacion-asignada",
  (res) => res,
);

/**
 * Hook para actualizar el estado de una coordinación
 * @payload { embarque_id, cod_file, cod_estado_actual, cod_estado_siguiente }
 */
export const useUpdateCoordinacionEstado = (params, options = {}) => {
  const queryClient = useQueryClient();

  return createDataMutationHook(
    ["coordinacion-estado-update"],
    "/api/appweb/actualizar-coordinacion-estado",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      // Invalidar cache de coordinaciones para refrescar listas tras cambio de estado
      queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

/**
 * Hook para copiar gastos desde una cotización a un embarque
 * Endpoint: POST /api/appweb/copiar-cotizacion-a-embarque
 * Payload: { cod_cotizaciondetalle, embarque_id, embarque_version }
 */
export const useCopiarCotizacionAEmbarque = (params, options = {}) => {
  const queryClient = useQueryClient();

  return createDataMutationHook(
    ["copiar-cotizacion-a-embarque"],
    "/api/appweb/copiar-cotizacion-a-embarque",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      const variables = args[1] || {};
      const embarqueId = variables?.embarque_id ?? params?.embarque_id;
      const embarqueVersion = variables?.embarque_version ?? params?.embarque_version;

      if (embarqueId) {
        queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos", embarqueId, embarqueVersion] });
        queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos-criterio", embarqueId, embarqueVersion] });
        queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos", embarqueId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos"] });
        queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos-criterio"] });
        queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos"] });
      }

      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

// ---------------------------------------------------------------------------
// DOCUMENTOS SOLICITUD FACTURACIÓN
// ---------------------------------------------------------------------------

/**
 * Hook para invocar el endpoint que genera los documentos de solicitud de facturación
 * El backend sólo utiliza el valor de embarque_id en la query string, por lo que
 * el payload puede enviarse vacío o incluir otros datos sin efecto.
 *
 * Ejemplo de uso:
 * ```js
 * const { mutateAsync } = useGenerarDocumentosSolicitudFacturacion();
 * await mutateAsync({ embarque_id: 46 });
 * ```
 *
 * @param {Object} options - opciones pasadas a useCustomMutation
 * @returns {UseMutationResult}
 */
export const useGenerarDocumentosSolicitudFacturacion = (options = {}) => {
  const queryClient = useQueryClient();

  return useCustomMutation({
    mutationFn: async (payload = {}) => {
      // El servicio espera el embarque_id como parámetro en la URL
      const { embarque_id, ...rest } = payload;
      const response = await api.post(
        "/api/appweb/generar-documentos-solicitud-facturacion",
        rest,
        {
          params: { embarque_id },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      const embarqueId = variables?.embarque_id || null;
      if (embarqueId) {
        // invalidar cualquier query relacionada si resulta necesario
        queryClient.invalidateQueries({ queryKey: ["coordinaciones", { embarque_id: embarqueId }] });
      }
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
    ...options,
  });
};
