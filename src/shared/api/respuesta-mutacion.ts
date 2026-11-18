import { ErrorDeNegocio } from "@/shared/api/errors";

/**
 * Lee un id devuelto por una mutación del catálogo.
 *
 * El sobre de mutación canónico es `{ data: { success, <campo> } }` (ver
 * `shared/api/api-response`), pero algunos endpoints anidan un nivel más. Se busca
 * en ambas profundidades en lugar de asumir una: si el id no aparece, devolvemos
 * `null` y el llamador decide (no redirigir, en vez de navegar a un id `NaN`).
 */
export function leerIdDeMutacion(respuesta: unknown, campo: string): number | null {
  const candidatos: unknown[] = [];
  if (respuesta && typeof respuesta === "object") {
    const raiz = respuesta as Record<string, unknown>;
    candidatos.push(raiz[campo]);
    if (raiz.data && typeof raiz.data === "object") {
      const nivel1 = raiz.data as Record<string, unknown>;
      candidatos.push(nivel1[campo]);
      if (nivel1.data && typeof nivel1.data === "object") {
        candidatos.push((nivel1.data as Record<string, unknown>)[campo]);
      }
    }
  }

  for (const candidato of candidatos) {
    const valor = Number(candidato);
    if (Number.isFinite(valor) && valor > 0) return valor;
  }
  return null;
}

/** Lee `data.mensaje` del sobre cuando la mutación falló a nivel de negocio. */
function mensajeDeFallo(respuesta: unknown): string | null {
  if (!respuesta || typeof respuesta !== "object") return null;
  const nivel1 = (respuesta as Record<string, unknown>).data;
  if (!nivel1 || typeof nivel1 !== "object") return null;
  const sobre = nivel1 as Record<string, unknown>;
  if (sobre.success !== false) return null;
  const mensaje = sobre.mensaje ?? sobre.message ?? sobre.error;
  return typeof mensaje === "string" && mensaje.trim() ? mensaje : "La operación no se completó";
}

/**
 * Convierte en `Error` el fallo de negocio que el backend responde como
 * HTTP 200 + `data.success: false` (ver `throwOnApiError`, que deliberadamente
 * no lo trata como error de transporte).
 *
 * Sin esto una mutación de catálogo resuelve como exitosa aunque el backend haya
 * rechazado la operación, y el call site emite el toast de éxito sobre datos que
 * nunca se guardaron.
 */
export function exigirExitoDeMutacion(respuesta: unknown, contexto: string): void {
  const fallo = mensajeDeFallo(respuesta);
  if (fallo !== null) throw new ErrorDeNegocio(`${contexto}: ${fallo}`);
}

/**
 * Variante estricta de `leerIdDeMutacion` para flujos multi-paso, donde perder
 * el id deja datos a medias (p. ej. un nodo BPM sin transición).
 *
 * El backend responde los errores de negocio con HTTP 200 + `success: false`, así
 * que `http` no los convierte en `ApiError` (ver `throwOnApiError`): sin esto el
 * call site solo puede decir "no vino el id" y se pierde el motivo real.
 */
export function exigirIdDeMutacion(respuesta: unknown, campo: string, contexto: string): number {
  const fallo = mensajeDeFallo(respuesta);
  if (fallo !== null) throw new ErrorDeNegocio(`${contexto}: ${fallo}`);
  const id = leerIdDeMutacion(respuesta, campo);
  if (id === null) throw new Error(`${contexto}: el backend no devolvió '${campo}'`);
  return id;
}
