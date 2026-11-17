# 0005 — TanStack Query: cache global + `meta:{silent,successMessage}`

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

El estado de servidor (datos del backend) necesitaba caché, deduplicación e
invalidación consistentes. Además, los toasts de éxito/error estaban dispersos:
cada hook decidía a mano cuándo y qué notificar, con resultados inconsistentes y
toasts duplicados.

## Decision

Centralizar el estado de servidor en **TanStack Query v5**
(`src/shared/lib/tanstack/query-client.ts`):

- **Cache global**: singleton en navegador (`getQueryClient`), instancia nueva por
  request en server. Defaults: `staleTime 60s`, `gcTime 5min`,
  `refetchOnWindowFocus: false`, `retry: 1`.
- **Toasts declarativos vía `meta`** (tipado con `Register` de TanStack):
  - `meta.silent` — no mostrar toast de error.
  - `meta.successMessage` — toast de éxito al completar una mutación.
- El `QueryCache.onError` / `MutationCache.onError`/`onSuccess` aplican esa
  política de forma central (`notifyError`). **Prohibido** escribir toasts a mano
  en queries/mutations.
- `SesionExpiradaError` nunca genera toast (el adaptador HTTP ya redirige a login,
  ver [ADR-0006](./0006-sesion-expirada-error.md)).

## Consequences

- **+** Una sola política de notificación; el call site solo declara intención.
- **+** Sin toasts duplicados ni "olvidados".
- **+** Caché coherente y predecible en toda la app.
- **−** Mensajes de éxito poco frecuentes/condicionales necesitan lógica algo más
  explícita que un `toast()` ad-hoc.

## Referencias

- `src/shared/lib/tanstack/query-client.ts`
- `src/shared/api/errors.ts` (`isSesionExpirada`, `mensajeDeError`)
- `CLAUDE.md` (Prohibiciones), `docs/ARQUITECTURA.md` §6
