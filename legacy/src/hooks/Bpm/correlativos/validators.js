import { toIsoDate } from "../../../pages/CorrelativoEmbarque/utils/date";

// ============================================================================
// VALIDADORES
// ============================================================================

/**
 * Valida y normaliza los campos comunes del correlativo
 * @param {Object} payload - Payload a validar
 * @throws {Error} Si hay campos inválidos o faltantes
 */
export function validateCommonFields(payload) {
  const {
    ref_tipo_secuencia,
    cod_empresa,
    cod_cc,
    titulo_guia,
    correlativo_serie,
  } = payload;

  if (!ref_tipo_secuencia || typeof ref_tipo_secuencia !== "string") {
    throw new Error("Debe indicar ref_tipo_secuencia (ej: HAWB o MAWB)");
  }

  if (!cod_empresa) {
    throw new Error("Debe indicar cod_empresa");
  }

  const isHawb = String(ref_tipo_secuencia).toUpperCase() === "HAWB";
  if (isHawb && !cod_cc) {
    throw new Error("HAWB requiere cod_cc (centro de costo)");
  }

  if (!titulo_guia || String(titulo_guia).trim() === "") {
    throw new Error("Debe indicar titulo_guia");
  }
  if (String(titulo_guia).length > 25) {
    throw new Error("titulo_guia debe tener máximo 25 caracteres");
  }

  if (!correlativo_serie || String(correlativo_serie).trim() === "") {
    throw new Error("Correlativo_serie es obligatorio");
  }
  if (String(correlativo_serie).length > 5) {
    throw new Error("correlativo_serie debe tener máximo 5 caracteres");
  }
}

/**
 * Valida y procesa un valor numérico
 * @param {*} value - Valor a validar
 * @param {string} message - Mensaje de error
 * @param {number} minValue - Valor mínimo permitido
 * @returns {number} Valor numérico validado
 * @throws {Error} Si el valor no es válido
 */
export function parseNumberOrThrow(value, message, minValue = -Infinity) {
  const n = Number(value);
  if (Number.isNaN(n) || n < minValue) throw new Error(message);
  return n;
}

/**
 * Valida campos de correlativos numéricos
 * @param {*} correlativo_inicial - Correlativo inicial
 * @param {*} correlativo_final - Correlativo final
 * @param {*} cantidad_saltos - Cantidad de saltos
 * @param {string} tipoSecuencia - Tipo de secuencia (HAWB, MAWB, etc.)
 * @returns {Object} Campos validados
 */
export function validateCorrelativeFields(
  correlativo_inicial,
  correlativo_final,
  cantidad_saltos,
  tipoSecuencia
) {
  if (correlativo_inicial === undefined || correlativo_inicial === null) {
    return {};
  }

  const fields = {};
  const inicioNum = parseNumberOrThrow(
    correlativo_inicial,
    "correlativo_inicial debe ser un número válido",
    0
  );
  fields.correlativo_inicial = inicioNum;

  if (correlativo_final !== undefined && correlativo_final !== null) {
    const minValue = tipoSecuencia === "HAWB" ? inicioNum + 1 : inicioNum;
    const finalNum = parseNumberOrThrow(
      correlativo_final,
      tipoSecuencia === "HAWB"
        ? "correlativo_final debe ser mayor que correlativo_inicial"
        : "correlativo_final debe ser mayor o igual que correlativo_inicial",
      minValue
    );
    fields.correlativo_final = finalNum;
  }

  if (cantidad_saltos !== undefined && cantidad_saltos !== null) {
    const salto = parseNumberOrThrow(
      cantidad_saltos,
      "cantidad_saltos debe ser un número mayor o igual a 1",
      1
    );
    fields.cantidad_saltos = salto;
  }

  return fields;
}

// ============================================================================
// BUILDERS DE PAYLOAD
// ============================================================================

const REF_BY_TYPE = {
  AEREO: "HAWB",
  TERRESTRE: "HCP",
  MARITIMO: "HBL",
};

/**
 * Construye el payload base para el correlativo
 * @param {Object} payload - Payload original
 * @returns {Object} Payload base normalizado
 */
export function buildBasePayload(payload) {
  const {
    ref_tipo_secuencia,
    cod_cc,
    cod_empresa,
    titulo_guia,
    correlativo_serie,
    fecha_vence,
    aplica_replica_anual,
    cod_entidad,
    tipo,
  } = payload;

  const formattedFechaVence = toIsoDate(fecha_vence);

  let finalRefTipo = ref_tipo_secuencia ?? null;
  const typeCandidateFromEntity =
    cod_entidad && typeof cod_entidad === "string"
      ? cod_entidad.toUpperCase().trim()
      : null;
  const typeCandidateFromTipo =
    tipo && typeof tipo === "string" ? tipo.toUpperCase().trim() : null;
  const candidateType = typeCandidateFromEntity || typeCandidateFromTipo;
  if (!finalRefTipo && candidateType && REF_BY_TYPE[candidateType]) {
    finalRefTipo = REF_BY_TYPE[candidateType];
  }

  return {
    ref_tipo_secuencia: finalRefTipo ?? ref_tipo_secuencia ?? null,
    cod_cc: cod_cc ?? null,
    cod_empresa,
    titulo_guia,
    correlativo_serie,
    fecha_vence: formattedFechaVence,
    aplica_replica_anual: aplica_replica_anual ?? null,
    cod_entidad: cod_entidad ?? null,
  };
}

/**
 * Procesa lista de guías manual para MAWB
 * @param {Array} lista_guias - Lista de guías
 * @returns {Array|null} Lista procesada o null
 */
export function processListaGuias(lista_guias) {
  if (!Array.isArray(lista_guias) || lista_guias.length === 0) {
    return null;
  }
  return lista_guias.map((g) => ({
    no_guia: String(g.no_guia ?? g.noGuia ?? g.no ?? g.numero ?? g),
  }));
}

/**
 * Procesa y valida campos específicos para HAWB
 * @param {Object} payloadToSend - Payload destino
 * @param {*} correlativo_inicial - Correlativo inicial
 * @param {*} correlativo_final - Correlativo final
 * @param {*} cantidad_saltos - Cantidad de saltos
 * @param {string} tipoSecuencia - Tipo de secuencia
 * @throws {Error} Si HAWB no tiene correlativo_inicial
 */
export function processHawbPayload(
  payloadToSend,
  correlativo_inicial,
  correlativo_final,
  cantidad_saltos,
  tipoSecuencia
) {
  if (correlativo_inicial === undefined || correlativo_inicial === null) {
    throw new Error("HAWB requiere correlativo_inicial");
  }
  const correlativeFields = validateCorrelativeFields(
    correlativo_inicial,
    correlativo_final,
    cantidad_saltos,
    tipoSecuencia
  );
  Object.assign(payloadToSend, correlativeFields);
}

/**
 * Procesa y valida campos específicos para MAWB
 * @param {Object} payloadToSend - Payload destino
 * @param {Object} payload - Payload original
 * @param {*} correlativo_inicial - Correlativo inicial
 * @param {*} correlativo_final - Correlativo final
 * @param {*} cantidad_saltos - Cantidad de saltos
 * @param {string} tipoSecuencia - Tipo de secuencia
 */
export function processMawbPayload(
  payloadToSend,
  payload,
  correlativo_inicial,
  correlativo_final,
  cantidad_saltos,
  tipoSecuencia
) {
  const { lista_guias } = payload;
  const listaGuiasProcesada = processListaGuias(lista_guias);
  if (listaGuiasProcesada) {
    payloadToSend.lista_guias = listaGuiasProcesada;
  }

  if (correlativo_inicial !== undefined && correlativo_inicial !== null) {
    const correlativeFields = validateCorrelativeFields(
      correlativo_inicial,
      correlativo_final,
      cantidad_saltos,
      tipoSecuencia
    );
    Object.assign(payloadToSend, correlativeFields);
  }
}

// ============================================================================
// NORMALIZACIÓN DE FECHAS
// ============================================================================

/**
 * Busca recursivamente una fecha ISO (YYYY-MM-DD) en un objeto
 * @param {Object} obj - Objeto a buscar
 * @returns {string|null} Fecha encontrada o null
 */
export function findIsoDateInObject(obj) {
  if (!obj || typeof obj !== "object") return null;
  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
  for (const v of Object.values(obj)) {
    if (!v) continue;
    if (typeof v === "string" && ISO_RE.test(v)) return v;
    if (v instanceof Date) return v.toISOString().split("T")[0];
    if (typeof v === "object") {
      const found = findIsoDateInObject(v);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Normaliza fecha_vence usando payload y payloadToSend con varios fallbacks
 * @param {Object} payload - Payload original
 * @param {Object} payloadToSend - Payload destino
 */
export function normalizeFechaVence(payload, payloadToSend) {
  try {
    const possibleDateKeys = ["fecha_vence", "fechaVencimiento", "fecha_vencimiento"];
    let finalDate = payloadToSend.fecha_vence;
    if (!finalDate) {
      for (const k of possibleDateKeys) {
        if (payload[k] !== undefined && payload[k] !== null) {
          finalDate = payload[k];
          break;
        }
      }
    }
    payloadToSend.fecha_vence = toIsoDate(finalDate) ?? null;
    if (!payloadToSend.fecha_vence) {
      const found = findIsoDateInObject(payload);
      if (found) {
        payloadToSend.fecha_vence = toIsoDate(found) ?? null;
      }
    }
  } catch (e) {
    console.warn("normalizeFechaVence fallback failed:", e);
  }
}

/**
 * Merge campos numéricos de correlativo al payload, ignorando inválidos
 * @param {Object} payloadToSend - Payload destino
 * @param {*} correlativo_inicial - Correlativo inicial
 * @param {*} correlativo_final - Correlativo final
 * @param {*} cantidad_saltos - Cantidad de saltos
 * @param {string} tipoSecuencia - Tipo de secuencia
 */
export function mergeNumericCorrelativeFields(
  payloadToSend,
  correlativo_inicial,
  correlativo_final,
  cantidad_saltos,
  tipoSecuencia
) {
  try {
    const numericCorrelativeFields = validateCorrelativeFields(
      correlativo_inicial,
      correlativo_final,
      cantidad_saltos,
      tipoSecuencia
    );
    if (Object.keys(numericCorrelativeFields).length > 0) {
      Object.assign(payloadToSend, numericCorrelativeFields);
    }
  } catch (e) {
    console.warn("mergeNumericCorrelativeFields ignored invalid numeric fields:", e);
  }
}

/**
 * Prepara el payload validando campos comunes y normalizando fecha_vence
 * @param {Object} payload - Payload original
 * @returns {Object} Payload preparado para enviar
 */
export function preparePayloadForCreate(payload) {
  validateCommonFields(payload);
  const payloadToSend = buildBasePayload(payload);
  normalizeFechaVence(payload, payloadToSend);
  return payloadToSend;
}
