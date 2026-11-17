# 0016 — Mutaciones con TanStack Query y `http`; Server Actions solo para cookies

- **Status**: Aceptado
- **Fecha**: 2026-11

## Context

Las mutaciones se habían implementado dos veces: como hooks de TanStack Query
sobre `http` ([ADR-0005](./0005-tanstack-query-meta.md)) y como Server Actions
sobre `serverHttp` en archivos `server-actions.ts`. Una auditoría encontró que
de 40 Server Actions solo 2 tenían llamadas reales: las que escriben y borran la
cookie de sesión. El resto no aportaba nada frente a los hooks:

- `revalidateTag` no tenía efecto: ningún fetch declara tags y los datos de
  pantalla viven en la caché de TanStack Query.
- Seis acciones apuntaban a rutas que no existen en `backend_cloud`, sin que
  nada lo señalara, porque solo las ejercitaban tests con el HTTP simulado.
- `serverHttp` no ejecuta `onSesionExpirada`
  ([ADR-0006](./0006-sesion-expirada-error.md)), y una acción de subida de
  archivos queda limitada por el `bodySizeLimit` de 1 MB que Next aplica por
  defecto.

Además, un archivo `"use server"` puede quedar publicado sin que nadie lo llame.
Next registró acciones sin uso en el build de producción cuando un Server
Component importaba un barrel que las reexportaba: lo hacían un `export *` en
`pricing/cotizacion/calculo/index.ts` y el barrel de `auth`. Next pide tratar toda
acción publicada como alcanzable por POST directo.

## Decision

- **Las mutaciones van con un hook de TanStack Query sobre `http`**, que pasa por
  `/api/proxy`. El hook vive en `features/<dominio>/api/` y usa
  `meta: { silent, successMessage }`.
- **Una Server Action solo se justifica si hay que escribir cookies**, algo que
  el navegador no puede hacer con una cookie httpOnly. Hoy el único caso es
  `src/features/auth/api/actions.ts` (`setAuthTokenCookie` y
  `removeAuthTokenCookie`).
- **Un archivo `"use server"` no se reexporta desde un barrel** que importe un
  Server Component si alguna de sus acciones no se llama desde esa ruta.

Las lecturas en servidor no cambian: siguen con `server-fetch.ts` y `serverHttp`
([ADR-0010](./0010-barrel-server-ts-fetchers-server-only.md)).

## Consequences

- **+** Una sola forma de mutar, con el manejo de sesión expirada y de errores
  centralizado.
- **+** Menos superficie pública: el build publica solo las acciones de cookie.
- **−** La regla no tiene un gate automático: se hace cumplir en revisión. Para
  auditarla, revisar `.next/server/server-reference-manifest.json` tras un build.

## Referencias

- `src/features/auth/api/actions.ts`, `src/shared/lib/auth/server-session.ts`
- `src/shared/api/client.ts`, `src/app/api/proxy/[...path]/route.ts`
- `docs/CONVENCIONES.md`, `docs/ARQUITECTURA.md`
