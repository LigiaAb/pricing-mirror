/**
 * Sesión pública (link de carta de instrucciones): token de interacción y
 * versión de app que el backend espera en los headers `Authorization` y
 * `version_app` de los endpoints `/clientes/api/*`.
 *
 * El ciclo de vida es responsabilidad de la vista pública (set al montar con
 * el `cli_inf` del link, clear al desmontar). Vive en módulo — no en
 * localStorage — para que el token no sobreviva a la pestaña ni se filtre a
 * otras vistas.
 */

let token: string | null = null;
let versionApp: string | null = null;

export function setPublicSession(
  nuevoToken: string | null | undefined,
  nuevaVersion?: string | null,
): void {
  token = nuevoToken || null;
  versionApp = nuevaVersion || null;
}

export function clearPublicSession(): void {
  token = null;
  versionApp = null;
}

export function getPublicSession(): { token: string | null; versionApp: string | null } {
  return { token, versionApp };
}
