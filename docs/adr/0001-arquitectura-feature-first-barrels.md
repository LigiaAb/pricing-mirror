# 0001 — Arquitectura feature-first con barrels `index.ts` curados

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

El código del frontend había crecido en carpetas técnicas transversales
(`src/store/`, `src/services/`, `src/lib/api/client.ts` y tipos por dominio
dispersos), lo que repartía cada dominio entre muchas carpetas y dificultaba
razonar sobre los límites de cada parte. No existía una "API pública" por
dominio: cualquier archivo podía importar cualquier otro por ruta profunda,
acoplando módulos sin control.

## Decision

Organizar el código **por dominio** (feature-first) bajo `src/features/<dominio>/`,
con subcarpetas internas `api/`, `components/`, `hooks/`, `stores/`, `lib/`, y un
**`index.ts` curado** como **única API pública** del feature (exports nombrados).

- Lo transversal vive en `src/shared/`; el routing en `src/app/` (solo monta
  wrappers/pages).
- Prohibido `export *`: el barrel lista exports nombrados deliberadamente.
- Al mover código no se dejan re-exports/alias de compatibilidad: se actualizan
  los call sites y se borra lo viejo.

Features actuales: `actividades`, `archivos`, `auth`, `carta-instrucciones`,
`catalogos`, `combex`, `coordinaciones`, `correlativos`, `embarques`, `entidades`,
`gastos`, `notificaciones`, `permisos`, `shell`.

Resultado de la migración: `src/store/` y `src/services/` se eliminaron y
`src/lib/api/client.ts` se reemplazó por `src/shared/api/`. `src/types/`
sobrevive **solo** como hogar de declaraciones ambientales `.d.ts`
(p. ej. `jspdf-barcode.d.ts`), no de tipos de dominio.

## Consequences

- **+** Cada dominio es una unidad cohesiva con superficie pública explícita.
- **+** El `index.ts` actúa como contrato: refactors internos no rompen consumidores.
- **+** Habilita las reglas de frontera de [ADR-0002](./0002-fronteras-dependency-cruiser.md).
- **−** Disciplina de mantener el barrel al día; coste real cuando un feature
  expone mucha superficie (ver excepciones en `embarques`, ADR-0002).
- Validado por `dependency-cruiser` (regla `cross-feature-solo-via-index`,
  `app-via-index`).

## Referencias

- `src/features/*/index.ts`
- `CLAUDE.md` (Mapa del repo, Prohibiciones), `docs/CONVENCIONES.md`
- `docs/ARQUITECTURA.md` §3
