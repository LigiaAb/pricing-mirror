/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
/*
 * Claves de `meta` de TanStack Query (ADR-0005). En el proyecto real se registran en
 * src/shared/lib/tanstack/query-client.ts; aquí solo se declaran para que tsc detecte
 * una clave mal escrita (sin esto, `meta` acepta cualquier cosa).
 *   - silent: no mostrar toast de error.
 *   - successMessage: toast de éxito al completar una mutación.
 */
import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { silent?: boolean };
    mutationMeta: { silent?: boolean; successMessage?: string };
  }
}
