# 0004 — Trío de adaptadores HTTP (`http`/`httpPublic`/`serverHttp`)

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

La app necesita hablar con el backend desde tres contextos distintos, cada uno
con reglas de auth y de resolución de URL diferentes:

1. Navegador autenticado (la mayoría de las llamadas).
2. Navegador sin sesión (login, carta pública).
3. React Server Components / route handlers (server-side).

Duplicar la lógica de fetch (headers, parseo, normalización de claves, taxonomía
de errores) en cada contexto produciría divergencia.

## Decision

Un **núcleo HTTP único** (`src/shared/api/http.ts`: `executeRequest` +
`createHttpMethods`) sobre el que se montan **tres adaptadores delgados**:

| Export       | Archivo         | Contexto              | Auth / URL                                                                    |
| ------------ | --------------- | --------------------- | ----------------------------------------------------------------------------- |
| `http`       | `api/client.ts` | navegador autenticado | vía `/api/proxy` (cookie httpOnly); única ruta de logout ante sesión expirada |
| `httpPublic` | `api/client.ts` | navegador público     | directo al backend, sin sesión                                                |
| `serverHttp` | `api/server.ts` | RSC / route handlers  | directo al backend con token de cookie; `import "server-only"`                |

El núcleo normaliza claves del backend a minúsculas (`normalizeKeys`), parsea la
respuesta y traduce todo a la taxonomía de errores ([ADR-0006](./0006-sesion-expirada-error.md)).
Un `HttpAdapter` define `resolveUrl`, `prepareHeaders?` y `onSesionExpirada?`.

## Consequences

- **+** Una sola implementación de fetch; los adaptadores solo cambian URL/headers.
- **+** `serverHttp` marcado `server-only` no puede filtrarse al bundle de cliente
  (motiva [ADR-0010](./0010-barrel-server-ts-fetchers-server-only.md)).
- **+** El logout automático vive en un único sitio (`http.onSesionExpirada`).
- **−** Elegir el adaptador correcto es responsabilidad del autor (un `http` en
  un RSC fallaría por falta de proxy).

## Referencias

- `src/shared/api/http.ts`, `src/shared/api/client.ts`, `src/shared/api/server.ts`
- `src/app/api/proxy/[...path]/`
- `docs/ARQUITECTURA.md` §5
