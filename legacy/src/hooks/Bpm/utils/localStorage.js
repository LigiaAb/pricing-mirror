/**
 * Obtiene el código de usuario desde localStorage.
 * @returns {number|null} Código de usuario o null si no existe/inválido
 */
export function getCodUsuarioFromLocalStorage() {
  try {
    const cod = localStorage.getItem("cod_usuario");
    if (cod == null) return null;
    const n = Number(cod);
    return Number.isNaN(n) ? null : n;
  } catch (e) {
    console.error("Error al obtener cod_usuario desde localStorage", e);
    return null;
  }
}
