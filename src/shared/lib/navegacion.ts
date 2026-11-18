/**
 * Navegación dura del browser (recarga completa). Aislada en un módulo propio
 * para que los tests la mockeen: `window.location` no es configurable en jsdom
 * cuando vitest corre con `pool: "vmThreads"`.
 */

export function redirigir(url: string): void {
  globalThis.location.href = url;
}

export function recargarPagina(): void {
  globalThis.location.reload();
}
