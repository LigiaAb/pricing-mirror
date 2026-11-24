import { toIsoDate } from "../utils/date";

// ============================================================================
// VALIDADORES COORDINACIONES
// ============================================================================

/**
 * Valida payload para actualizar ATD de coordinación asignada
 * @param {Object} payload
 * @returns {{valid: boolean, errors: string[]}} Resultado de la validación
 */
export function validateUpdateAtdCoordinacionAsignada(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    errors.push("Payload inválido");
    return { valid: false, errors };
  }

  const { embarque_id, cod_file, fecha_atd } = payload;

  if (embarque_id === undefined || embarque_id === null || Number.isNaN(Number(embarque_id))) {
    errors.push("embarque_id es obligatorio y debe ser numérico");
  } else {
    const embarqueStr = String(embarque_id);
    if (embarqueStr.length < 1 || embarqueStr.length > 6) {
      errors.push("embarque_id debe tener entre 1 y 6 dígitos");
    }
  }

  if (!cod_file || String(cod_file).trim() === "") {
    errors.push("cod_file es obligatorio");
  } else if (String(cod_file).length > 25) {
    errors.push("cod_file debe tener máximo 25 caracteres");
  }

  // Fecha ISO YYYY-MM-DD
  const fechaNormalized = toIsoDate(fecha_atd);
  if (!fechaNormalized) {
    errors.push("fecha_atd debe tener formato YYYY-MM-DD");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

export default { validateUpdateAtdCoordinacionAsignada };