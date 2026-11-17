# 0008 — Factory `createCatalogo` para catálogos CRUD

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

El ERP tiene muchos catálogos (países, rubros, tratamientos, periodicidad,
usuarios…), todos con el mismo patrón: listar (con filtros) y mutar (crear/editar/
eliminar) con invalidación de caché. Escribir a mano el `queryOptions`, los hooks
y las mutaciones de cada uno multiplicaba código casi idéntico.

## Decision

Una **factory** `createCatalogo` (`src/features/catalogos/api/create-catalogo.ts`):
a partir de una config mínima (~20 líneas: `nombre`, `schema` zod, `endpoints` y
opcionalmente `map`/`cache`/`habilitado`) genera:

- `queryKeys` consistentes,
- `listaOptions` / `useLista` (`queryOptions` + `useQuery`) que pasan por
  `parseEnvelope` con el schema,
- hooks de mutación con invalidación (`createCatalogoMutation`).

Cada catálogo concreto vive en `src/features/catalogos/api/<nombre>.ts` y se
expone por el `index.ts` del feature.

## Consequences

- **+** Un catálogo nuevo es ~20 líneas en vez de un archivo entero.
- **+** Comportamiento uniforme (caché, validación, invalidación) por construcción.
- **+** Integra `parseEnvelope` ([ADR-0003](./0003-envelope-parse-envelope.md)) y
  los defaults de caché de `src/shared/api/cache.ts`.
- **−** Casos atípicos que se salen del patrón necesitan hooks a medida (la
  factory cubre el caso común, no todos).

## Referencias

- `src/features/catalogos/api/create-catalogo.ts`
- `src/features/catalogos/api/*.ts` (instancias), `src/shared/api/cache.ts`
- `docs/ARQUITECTURA.md` §5 (patrón API)
