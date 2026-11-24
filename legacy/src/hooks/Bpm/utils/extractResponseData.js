/**
 * Extrae datos de respuestas API con estructura anidada variable.
 * Soporta: response.data.data.data | response.data.data | response.data | [] | {data: [...]} | {data: {data: [...]}}
 *
 * @param {Object} response - Respuesta de Axios
 * @returns {Array} Array de datos extraídos
 */
export function extractResponseData(response) {
  if (Array.isArray(response?.data?.data?.data)) {
    return response.data.data.data;
  }
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
}

/**
 * Extrae datos de respuestas ya desestructuradas ({ data })
 * @param {Object} data - Objeto data de la respuesta
 * @returns {Array} Array de datos extraídos
 */
export function extractFromData(data) {
  if (Array.isArray(data?.data?.data)) {
    return data.data.data;
  }
  if (Array.isArray(data?.data?.data)) {
    return data.data.data;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}
