import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

function assertRequiredParams(params, requiredKeys) {
  const missing = requiredKeys.filter((key) => params[key] === undefined || params[key] === null || params[key] === "");
  if (missing.length > 0) {
    throw new Error(`Faltan parámetros obligatorios: ${missing.join(", ")}`);
  }
}

function mapLegsRecord(item) {
  return {
    embLegsId: item.emb_legs_id ?? item.EMB_LEGS_ID,
    embarqueId: item.embarque_id ?? item.EMBARQUE_ID,
    orden: item.orden ?? item.ORDEN,
    codFile: item.cod_file ?? item.COD_FILE,
    codTipoTransporte: item.tipo_id_transporte ?? item.TIPO_ID_TRANSPORTE,
    tipoDescripcionTransporte: item.tipo_descripcion_transporte ?? item.TIPO_DESCRIPCION_TRANSPORTE,
    empresaId: item.empresa_id ?? item.EMPRESA_ID,
    empresaNombre: item.empresa_nombre ?? item.EMPRESA_NOMBRE,
    cencosId: item.cencos_id ?? item.CENCOS_ID,
    cencodNombre: item.cencod_nombre ?? item.CENCOD_NOMBRE,
    paisIdOrigen: item.pais_id_origen ?? item.PAIS_ID_ORIGEN,
    nombrePaisOrigen: item.nombre_pais_origen ?? item.NOMBRE_PAIS_ORIGEN,
    paisIdDestino: item.pais_id_destino ?? item.PAIS_ID_DESTINO,
    nombrePaisDestino: item.nombre_pais_destino ?? item.NOMBRE_PAIS_DESTINO,
    puntoenlaceIdOrigen: item.puntoenlace_id_origen ?? item.PUNTOENLACE_ID_ORIGEN,
    puntoenlaceNombreOrigen: item.PUNTOENLACE_NOMBRE_ORIGEN ?? item.puntoenlace_nombre_origen,
    puntoenlaceIdDestino: item.puntoenlace_id_destino ?? item.PUNTOENLACE_ID_DESTINO,
    puntoenlaceNombreDestino: item.puntoenlace_nombree_destino ?? item.PUNTOENLACE_NOMBREE_DESTINO,
    entidadIdProvTrans: item.entidad_id_prov_trans ?? item.ENTIDAD_ID_PROV_TRANS,
    entidadNombreProv: item.entidad_nombre_prov ?? item.ENTIDAD_NOMBRE_PROV,
    masterNumber: item.master_number ?? item.MASTER_NUMBER,
    flightNumber: item.flight_number ?? item.FLIGHT_NUMBER,
    vesselName: item.vessel_name ?? item.VESSEL_NAME,
    voyageNumber: item.voyage_number ?? item.VOYAGE_NUMBER,
    documentoSoporte: item.documento_soporte ?? item.DOCUMENTO_SOPORTE,
    costoEstimado: item.costo_estimado ?? item.COSTO_ESTIMADO,
    costoReal: item.costo_real ?? item.COSTO_REAL,
    usuarioIdRegistra: item.usuario_id_registra ?? item.USUARIO_ID_REGISTRA,
    usuarioRegistra: item.usuario_registra ?? item.USUARIO_REGISTRA,
    estadoId: item.estado_id ?? item.ESTADO_ID,
    estadoDescripcion: item.estado_descripcion ?? item.ESTADO_DESCRIPCION,
    fechaRegistro: item.fecha_registro ?? item.FECHA_REGISTRO,
    fechaSalida: item.fecha_salida ?? item.FECHA_SALIDA ?? item.fechaSalida ?? item.FECHA_SALIDA ?? null,
    fechaLlegada: item.fecha_llegada ?? item.FECHA_LLEGADA ?? item.fechaLlegada ?? item.FECHA_LLEGADA ?? null,
    fecha_salida: item.fecha_salida ?? item.FECHA_SALIDA ?? item.fechaSalida ?? item.FECHA_SALIDA ?? null,
    fecha_llegada: item.fecha_llegada ?? item.FECHA_LLEGADA ?? item.fechaLlegada ?? item.FECHA_LLEGADA ?? null,
    // Campos en payload de actualización/inserción
    codTipoTransportePayload: item.cod_tipo_transporte ?? item.COD_TIPO_TRANSPORTE ?? item.tipo_id_transporte ?? item.TIPO_ID_TRANSPORTE,
    codEntidadProv: item.cod_entidad_prov ?? item.COD_ENTIDAD_PROV ?? item.entidad_id_prov_trans ?? item.ENTIDAD_ID_PROV_TRANS,
    codPaisOrigen: item.cod_pais_origen ?? item.COD_PAIS_ORIGEN ?? item.pais_id_origen ?? item.PAIS_ID_ORIGEN,
    codPaisDestino: item.cod_pais_destino ?? item.COD_PAIS_DESTINO ?? item.pais_id_destino ?? item.PAIS_ID_DESTINO,
    puertoIdOrigen: item.puerto_id_origen ?? item.PUERTO_ID_ORIGEN ?? item.puntoenlace_id_origen ?? item.PUNTOENLACE_ID_ORIGEN,
    puertoIdDestino: item.puerto_id_destino ?? item.PUERTO_ID_DESTINO ?? item.puntoenlace_id_destino ?? item.PUNTOENLACE_ID_DESTINO,
    codServicio: item.cod_servicio ?? item.COD_SERVICIO,
    codTipoCarga: item.cod_tipo_carga ?? item.COD_TIPO_CARGA,
    estadoCod: item.estado_cod ?? item.ESTADO_COD,
    urlDocumentoSoporte: item.url_documento_soporte ?? item.URL_DOCUMENTO_SOPORTE,
  };
}

export function useCoordinacionLegs(embarque_id, cod_cc, cod_empresa, options = {}) {
  return useQuery({
    queryKey: ["coordinacion-legs", String(embarque_id), String(cod_cc), String(cod_empresa)],
    queryFn: async () => {
      assertRequiredParams({ embarque_id, cod_cc, cod_empresa }, ["embarque_id", "cod_cc", "cod_empresa"]);

      const response = await api.get("/api/appweb/listar-coordinacion-legs", {
        params: {
          embarque_id,
          cod_cc,
          cod_empresa,
        },
      });

      const data = extractFromData(response.data);
      return data.map(mapLegsRecord);
    },
    enabled: !!embarque_id && !!cod_cc && !!cod_empresa,
    ...CACHE_DYNAMIC,
    ...options,
  });
}

function buildLegsPayload(values) {
  const payload = {
    embarque_id: values.embarque_id || values.EMBARQUE_ID,
    cod_file: values.cod_file || values.codFile || values.COD_FILE,
    cod_tipo_transporte: values.cod_tipo_transporte || values.COD_TIPO_TRANSPORTE,
    cod_entidad_prov: values.cod_entidad_prov || values.COD_ENTIDAD_PROV,
    cod_pais_origen: values.cod_pais_origen || values.COD_PAIS_ORIGEN,
    cod_pais_destino: values.cod_pais_destino || values.COD_PAIS_DESTINO,
    puerto_id_origen: values.puerto_id_origen || values.PUERTO_ID_ORIGEN || values.puntoenlace_id_origen || values.PUNTOENLACE_ID_ORIGEN,
    puerto_id_destino: values.puerto_id_destino || values.PUERTO_ID_DESTINO || values.puntoenlace_id_destino || values.PUNTOENLACE_ID_DESTINO,
    cod_servicio: values.cod_servicio || values.COD_SERVICIO,
    cod_tipo_carga: values.cod_tipo_carga || values.COD_TIPO_CARGA,
    estado_cod: values.estado_cod || values.ESTADO_COD,
    master_number: values.master_number || values.MASTER_NUMBER || "",
    flight_number: values.flight_number || values.FLIGHT_NUMBER || "",
    vessel_name: values.vessel_name || values.VESSEL_NAME || "",
    voyage_number: values.voyage_number || values.VOYAGE_NUMBER || "",
    url_documento_soporte: values.url_documento_soporte || values.URL_DOCUMENTO_SOPORTE || "",
    fecha_salida: values.fecha_salida || values.FECHA_SALIDA || values.fechaSalida || values.FECHA_SALIDA || null,
    fecha_llegada: values.fecha_llegada || values.FECHA_LLEGADA || values.fechaLlegada || values.FECHA_LLEGADA || null,
    costo_estimado: values.costo_estimado || values.COSTO_ESTIMADO || 0,
    costo_real: values.costo_real || values.COSTO_REAL || 0,
  };
  if (values.emb_legs_id || values.EMB_LEGS_ID) {
    payload.emb_legs_id = values.emb_legs_id || values.EMB_LEGS_ID;
  }
  return payload;
}

/**
 * Hook BPM para insertar un leg de coordinación
 *
 * NOMBRE                  OBLIGATORIO       TIPO      TAMAÑO  DESCRIPCIÓN
 * embarque_id             SI                Numerico  1-6     Requerido al insertar y actualizar
 * emb_legs_id             SI (actualiza)    Numerico  1-6     Requerido al actualizar
 * cod_tipo_transporte     SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_entidad_prov        SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_pais_origen         SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_pais_destino        SI                Numerico  1-6     Requerido al insertar y actualizar
 * puerto_id_origen        SI                Numerico  1-6     Requerido al insertar y actualizar
 * puerto_id_destino       SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_servicio            SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_tipo_carga          SI                Numerico  1-6     Requerido al insertar y actualizar
 * estado_cod              SI                Numerico  1-6     Requerido al insertar y actualizar
 * master_number           NO                Texto     30
 * flight_number           NO                Texto     30
 * vessel_name             NO                Texto     30
 * voyage_number           NO                Texto     30
 * url_documento_soporte   NO                Texto     150
 * costo_estimado          NO                Numerico  9
 * costo_real              NO                Numerico  9
 */
export function useInsertarCoordinacionLegs(params, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values) => {
      const payload = buildLegsPayload(values);
      assertRequiredParams(payload, [
        "embarque_id",
        "cod_tipo_transporte",
        "cod_entidad_prov",
        "cod_pais_origen",
        "cod_pais_destino",
        "puerto_id_origen",
        "puerto_id_destino",
        "cod_servicio",
        "cod_tipo_carga",
        "estado_cod",
      ]);
      const response = await api.post("/api/appweb/insertar-coordinacion-legs", payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coordinacion-legs", String(variables.embarque_id), String(variables.cod_cc), String(variables.cod_empresa)] });
      queryClient.invalidateQueries({ queryKey: ["coordinacion-legs"] });
      if (options.onSuccess) options.onSuccess(data, variables);
    },
    ...options,
  });
}

/**
 * Hook BPM para actualizar un leg de coordinación
 *
 * NOMBRE                  OBLIGATORIO       TIPO      TAMAÑO  DESCRIPCIÓN
 * embarque_id             SI                Numerico  1-6     Requerido al insertar y actualizar
 * emb_legs_id             SI                Numerico  1-6     Requerido al actualizar
 * cod_tipo_transporte     SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_entidad_prov        SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_pais_origen         SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_pais_destino        SI                Numerico  1-6     Requerido al insertar y actualizar
 * puerto_id_origen        SI                Numerico  1-6     Requerido al insertar y actualizar
 * puerto_id_destino       SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_servicio            SI                Numerico  1-6     Requerido al insertar y actualizar
 * cod_tipo_carga          SI                Numerico  1-6     Requerido al insertar y actualizar
 * estado_cod              SI                Numerico  1-6     Requerido al insertar y actualizar
 * master_number           NO                Texto     30
 * flight_number           NO                Texto     30
 * vessel_name             NO                Texto     30
 * voyage_number           NO                Texto     30
 * url_documento_soporte   NO                Texto     150
 * costo_estimado          NO                Numerico  9
 * costo_real              NO                Numerico  9
 */
export function useActualizarCoordinacionLegs(params, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values) => {
      const payload = buildLegsPayload(values);
      assertRequiredParams(payload, [
        "embarque_id",
        "emb_legs_id",
        "cod_tipo_transporte",
        "cod_entidad_prov",
        "cod_pais_origen",
        "cod_pais_destino",
        "puerto_id_origen",
        "puerto_id_destino",
        "cod_servicio",
        "cod_tipo_carga",
        "estado_cod",
      ]);
      const response = await api.post("/api/appweb/actualizar-coordinacion-legs", payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coordinacion-legs", String(variables.embarque_id), String(variables.cod_cc), String(variables.cod_empresa)] });
      queryClient.invalidateQueries({ queryKey: ["coordinacion-legs"] });
      if (options.onSuccess) options.onSuccess(data, variables);
    },
    ...options,
  });
}

export function useEliminarCoordinacionLegs(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values) => {
      const emb_legs_id = values.emb_legs_id || values.EMB_LEGS_ID;
      if (!emb_legs_id) throw new Error("Falta parámetro obligatorio: emb_legs_id");
      const response = await api.post("/api/appweb/eliminar-coordinacion-legs", { emb_legs_id });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coordinacion-legs"] });
      if (options.onSuccess) options.onSuccess(data, variables);
    },
    ...options,
  });
}

export function useCoordinacionLegsCRUD(embarque_id, cod_cc, cod_empresa, options = {}) {
  const legsQuery = useCoordinacionLegs(embarque_id, cod_cc, cod_empresa, options);
  const insertar = useInsertarCoordinacionLegs();
  const actualizar = useActualizarCoordinacionLegs();
  const eliminar = useEliminarCoordinacionLegs();

  return {
    ...legsQuery,
    insertar,
    actualizar,
    eliminar,
    isLoading: legsQuery.isLoading || insertar.isLoading || actualizar.isLoading || eliminar.isLoading,
    error: legsQuery.error || insertar.error || actualizar.error || eliminar.error,
  };
}
