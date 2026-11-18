import { asText } from "@/shared/lib/text";

const pickFirst = (
  obj: Record<string, unknown> | null | undefined,
  candidates: string[],
): unknown => {
  if (!obj) return null;
  for (const key of candidates) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

export function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(asText(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

const detallesEmbarqueSafe = (
  obj: Record<string, unknown> | null | undefined,
  keys: string[],
): unknown => {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

const payloadFieldCandidates: Record<string, string[]> = {
  embarque_id: ["embarque_id", "EMBARQUE_ID", "id", "embarqueId"],
  cod_file: ["cod_file", "COD_FILE", "codFile"],
  cod_empresa: ["cod_empresa", "COD_EMPRESA", "empresa_id", "EMPRESA_ID", "empresaId"],
  cod_cc: [
    "cod_cc",
    "COD_CC",
    "cencos_id",
    "CENCOS_ID",
    "cencod_id",
    "CENCOD_ID",
    "centro_id",
    "centroId",
  ],
  cod_tipo_embarque: [
    "cod_tipo_embarque",
    "COD_TIPO_EMBARQUE",
    "tipo_id_embarque",
    "TIPO_ID_EMBARQUE",
    "tipo_id",
  ],
  cod_entidad_cli: [
    "cod_entidad_cli",
    "COD_ENTIDAD_CLI",
    "ENTIDAD_ID_CLI",
    "entidad_id_cli",
    "entidadIdCli",
  ],
  cod_pais_origen: [
    "cod_pais_origen",
    "COD_PAIS_ORIGEN",
    "pais_id_origen",
    "PAIS_ID_ORIGEN",
    "paisOrigen",
    "pais_origen",
  ],
  cod_pais_destino: [
    "cod_pais_destino",
    "COD_PAIS_DESTINO",
    "pais_id_destino",
    "PAIS_ID_DESTINO",
    "paisDestino",
    "pais_destino",
  ],
  puerto_id_origen: [
    "puerto_id_origen",
    "PUNTOENLACE_ID_ORIGEN",
    "puntoenlace_id_origen",
    "puntoenlaceIdOrigen",
  ],
  puerto_id_destino: [
    "puerto_id_destino",
    "PUNTOENLACE_ID_DESTINO",
    "puntoenlace_id_destino",
    "puntoenlaceIdDestino",
  ],
  cod_servicio: [
    "cod_servicio",
    "COD_SERVICIO",
    "cod_relacion_tipo",
    "COD_RELACION_TIPO",
    "ID_SERVICIO",
    "id_servicio",
    "servicio_id",
    "servicio",
  ],
  cod_tipo_carga: [
    "cod_tipo_carga",
    "COD_TIPO_CARGA",
    "tipo_id_carga",
    "TIPO_ID_CARGA",
    "tipoCarga",
  ],
  incoterm_id: [
    "incoterm_id",
    "INCOTERM_ID",
    "cod_incoterm",
    "COD_INCOTERM",
    "incoterm",
    "INCOTERM",
  ],
  cod_tipo_pago: ["cod_tipo_pago", "COD_TIPO_PAGO", "tipo_id_pago", "tipoPago", "tipo_pago"],
  cod_asesor: ["cod_asesor", "COD_ASESOR", "asesor_id", "ASESOR_ID"],
  observacion: ["observacion", "OBSERVACION", "observaciones", "OBSERVACIONES"],
  cod_embarque_padre: [
    "cod_embarque_padre",
    "COD_EMBARQUE_PADRE",
    "embarque_padre_id",
    "EMBARQUE_PADRE_ID",
  ],
  cod_cotizacion_cabecera: [
    "cod_cotizacion_cabecera",
    "COD_COTIZACION_CABECERA",
    "cotizacioncabecera_id",
    "COTIZACIONCABECERA_ID",
    "cotizacionCabeceraId",
  ],
  cod_entidad_shipper: [
    "cod_entidad_shipper",
    "COD_ENTIDAD_SHIPPER",
    "entidad_id_shipper",
    "ENTIDAD_ID_SHIPPER",
    "entidadIdShipper",
  ],
  cod_entidad_consignatario: [
    "cod_entidad_consignatario",
    "COD_ENTIDAD_CONSIGNATARIO",
    "entidad_id_consignatario",
    "ENTIDAD_ID_CONSIGNATARIO",
    "entidadIdConsignatario",
  ],
  cod_entidad_estacion: [
    "cod_entidad_estacion",
    "COD_ENTIDAD_ESTACION",
    "entidad_id_estacion",
    "ENTIDAD_ID_ESTACION",
    "entidadIdEstacion",
    "estacion_dsv_id",
    "ESTACION_DSV_ID",
  ],
  cotizacioncabecera_id: [
    "cotizacioncabecera_id",
    "COTIZACIONCABECERA_ID",
    "cod_cotizacion_cabecera",
    "COD_COTIZACION_CABECERA",
    "cotizacionCabeceraId",
  ],
  char_w: ["char_w", "CHAR_W", "cw", "CW"],
  json_datos_opcionales: [
    "json_datos_opcionales",
    "jsonDatosOpcionales",
    "json_atributos_opcionales",
    "jsonAtributosOpcionales",
  ],
  // G17: el legacy siempre preserva estos 4 campos por defecto (payloadUtils.js);
  // sin ellos, un `actualizar-coordinacion` que no los toque los manda ausentes
  // (no null explícito) y el backend puede interpretarlo como "borrar".
  contacto_id_shipper: ["contacto_id_shipper", "CONTACTO_ID_SHIPPER", "contactoIdShipper"],
  contacto_id_consignatario: [
    "contacto_id_consignatario",
    "CONTACTO_ID_CONSIGNATARIO",
    "contactoIdConsignatario",
  ],
  contacto_id_cliente: ["contacto_id_cliente", "CONTACTO_ID_CLIENTE", "contactoIdCliente"],
  json_documentos: ["json_documentos", "JSON_DOCUMENTOS", "jsonDocumentos"],
};

const numericPayloadFields = new Set([
  "embarque_id",
  "cod_empresa",
  "cod_cc",
  "cod_tipo_embarque",
  "cod_entidad_cli",
  "cod_pais_origen",
  "cod_pais_destino",
  "puerto_id_origen",
  "puerto_id_destino",
  "cod_servicio",
  "cod_tipo_carga",
  "incoterm_id",
  "cod_tipo_pago",
  "cod_asesor",
  "cod_embarque_padre",
  "cod_cotizacion_cabecera",
  "cod_entidad_shipper",
  "cod_entidad_consignatario",
  "cod_entidad_estacion",
  "cotizacioncabecera_id",
  "contacto_id_shipper",
  "contacto_id_consignatario",
  "contacto_id_cliente",
]);

export interface CoordPayload {
  [key: string]: unknown;
}

function buildPayloadFromCandidates(
  data: Record<string, unknown>,
  existingJson: unknown,
): CoordPayload {
  const payload: CoordPayload = {};

  for (const [targetKey, candidates] of Object.entries(payloadFieldCandidates)) {
    let value = pickFirst(data, candidates);

    if (targetKey === "cod_empresa" && (value === null || value === undefined || value === "")) {
      value = (data?.empresa as Record<string, unknown>)?.cod_empresa ?? null;
    }

    if (targetKey === "cod_cc" && (value === null || value === undefined || value === "")) {
      value = detallesEmbarqueSafe(data, [
        "cencos_id",
        "CENCOS_ID",
        "cencod_id",
        "cod_cc",
        "COD_CC",
      ]);
    }

    if (targetKey === "json_datos_opcionales" && value == null) {
      value = existingJson ?? null;
    }

    payload[targetKey] = numericPayloadFields.has(targetKey)
      ? toNullableNumber(value)
      : (value ?? null);
  }

  if (!payload.cod_file) {
    payload.cod_file = "";
  }

  return payload;
}

function applyJsonOverrides(
  payload: CoordPayload,
  overrides: Record<string, unknown>,
  existingJson: unknown,
): void {
  if (
    !Object.hasOwn(overrides, "json_datos_opcionales") &&
    !Object.hasOwn(overrides, "jsonDatosOpcionales") &&
    !Object.hasOwn(overrides, "json_atributos_opcionales") &&
    !Object.hasOwn(overrides, "jsonAtributosOpcionales")
  ) {
    if (existingJson === undefined) {
      delete payload.json_datos_opcionales;
    } else {
      payload.json_datos_opcionales = existingJson;
    }
  }
}

function serializeJsonDatosOpcionales(payload: CoordPayload): void {
  if (payload.json_datos_opcionales !== undefined && payload.json_datos_opcionales !== null) {
    if (typeof payload.json_datos_opcionales !== "string") {
      payload.json_datos_opcionales = JSON.stringify(payload.json_datos_opcionales);
    }
  }
}

export function buildCoordPayload(
  data: unknown = {},
  overrides: Record<string, unknown> = {},
  codUsuario: string | number | null = null,
): CoordPayload {
  const src = (data ?? {}) as Record<string, unknown>;
  const existingJson =
    src?.json_datos_opcionales ??
    src?.jsonDatosOpcionales ??
    src?.json_atributos_opcionales ??
    src?.jsonAtributosOpcionales;

  const payload = buildPayloadFromCandidates(src, existingJson);

  Object.assign(payload, overrides);

  applyJsonOverrides(payload, overrides, existingJson);

  delete payload.estado_cod;
  delete payload.embarque_version;

  if (codUsuario) {
    payload.cod_asesor = codUsuario;
  }

  serializeJsonDatosOpcionales(payload);

  return payload;
}

export function getEmbarqueId(data: unknown = {}, fallbackId: number | null = null): number | null {
  const src = (data ?? {}) as Record<string, unknown>;
  const raw = fallbackId ?? pickFirst(src, ["embarque_id", "EMBARQUE_ID", "id", "embarqueId"]);

  if (raw === undefined || raw === null || raw === "") return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function refreshCoordinationSharedData(
  queryClient: {
    setQueryData: (key: string[], updater: (prev: unknown) => unknown) => void;
    invalidateQueries: (opts: { queryKey: string[]; exact?: boolean }) => Promise<void>;
    refetchQueries: (opts: { queryKey: string[]; exact?: boolean }) => Promise<void>;
  },
  embarqueId: number,
  partialPayload: Record<string, unknown> = {},
): Promise<void> {
  if (!queryClient || !embarqueId) return;

  const embarqueQueryKey = ["embarque-info", String(embarqueId)];

  queryClient.setQueryData(embarqueQueryKey, (prev: unknown) => ({
    ...(prev as Record<string, unknown>),
    ...partialPayload,
  }));

  await queryClient.invalidateQueries({ queryKey: embarqueQueryKey, exact: true });
  await queryClient.refetchQueries({ queryKey: embarqueQueryKey, exact: true });

  queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
}
