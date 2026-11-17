# 0006 — `SesionExpiradaError` y flujo `onSesionExpirada`

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

El backend señala una sesión inválida de dos formas: HTTP 401, **o** una
respuesta HTTP 200 con `success: false` y `cod_mensaje: 1003` dentro del sobre.
Detectar esto parseando mensajes en cada hook era frágil, y la respuesta correcta
(cerrar sesión y redirigir) debía ser única y consistente.

## Decision

Una **taxonomía de errores** por instancia en `src/shared/api/errors.ts`,
distinguida con `instanceof` (nunca parseando texto):

- `ApiError` — error genérico del backend; lleva `codMensaje`.
- `SesionExpiradaError extends ApiError` — sesión inválida (HTTP 401 **o**
  `cod_mensaje: 1003`).
- `EnvelopeInvalidoError` — la respuesta no cumple el schema (solo en dev).
- Helpers `isSesionExpirada(err)`, `isApiError(err)`, `mensajeDeError(err)`.

El núcleo HTTP (`throwOnApiError`) construye el error correcto. Cuando es
`SesionExpiradaError`, el adaptador de navegador (`http`) ejecuta
`onSesionExpirada()`: `clearSession()` (logout del store Zustand) + redirect a
`/login`. El proxy (`http`) es la **única** ruta de logout automático.

## Consequences

- **+** Un único punto de decisión y de logout; el resto de la app solo
  distingue tipos por `instanceof`.
- **+** Cubre las dos señales del backend (401 y 1003) de forma uniforme.
- **+** Composición limpia con TanStack Query: sesión expirada no muestra toast
  ([ADR-0005](./0005-tanstack-query-meta.md)).
- **−** El `serverHttp` no redirige (no hay `window`); los RSC propagan el error
  y la capa superior decide.

## Referencias

- `src/shared/api/errors.ts`, `src/shared/api/http.ts` (`throwOnApiError`)
- `src/shared/api/client.ts` (`onSesionExpirada`), `src/shared/lib/auth/session.ts`
- `docs/ARQUITECTURA.md` §7
