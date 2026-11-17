# 0010 — Barrel hermano `server.ts` para fetchers `server-only`

- **Status**: Aceptado
- **Fecha**: 2026-06 (fase 6, área B1)

## Context

`coordinaciones/api/server-fetch.ts` y `correlativos/api/server-fetch.ts`
empiezan con `import "server-only"` (fetchers que solo deben ejecutarse en RSC).
Los `page.tsx` (RSC) los importaban por ruta profunda, violando la regla
`app-via-index` ([ADR-0002](./0002-fronteras-dependency-cruiser.md)).

No se pueden re-exportar desde el `index.ts` del feature: ese mismo barrel exporta
hooks de cliente (`useCoordinacion`, etc.), así que cualquier import de valor
desde un componente cliente arrastraría el módulo `server-only` al bundle de
cliente y el guard rompería el build.

## Decision

Introducir un **barrel hermano** `src/features/<feature>/server.ts` que re-exporta
(named exports, no `export *`) los fetchers `server-only`. Los RSC importan de
`@/features/coordinaciones/server` / `@/features/correlativos/server`.

La regla `app-via-index` se amplía para aceptar **`index.ts` o `server.ts`** como
puntos de entrada válidos:

```js
pathNot: [String.raw`^src/features/[^/]+/(index|server)\.ts$` /* … */];
```

`server.ts` se añade al `exclude` de coverage (barrel puro, igual que `index.ts`).

## Consequences

- **+** Los fetchers server-only quedan dentro de la frontera `app-via-index` sin
  contaminar el bundle de cliente.
- **+** Separación explícita entre superficie cliente (`index.ts`) y servidor
  (`server.ts`).
- **−** Un segundo barrel por feature que lo necesite (hoy solo 2: `coordinaciones`,
  `correlativos`).

## Referencias

- `src/features/coordinaciones/server.ts`, `src/features/correlativos/server.ts`
- `.dependency-cruiser.cjs` (`app-via-index`), `vitest.config.mts` (`exclude: **/server.ts`)
- `docs/ARQUITECTURA.md` §4
