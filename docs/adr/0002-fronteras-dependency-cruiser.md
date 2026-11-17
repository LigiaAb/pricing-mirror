# 0002 — Fronteras de dependencias con dependency-cruiser

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

La arquitectura feature-first ([ADR-0001](./0001-arquitectura-feature-first-barrels.md))
solo se sostiene si las fronteras se imponen de forma automática. Sin un gate,
los imports por ruta profunda y los ciclos reaparecen.

## Decision

Imponer las fronteras con **dependency-cruiser** (`.dependency-cruiser.cjs`),
ejecutado en CI (`pnpm depcruise`). **5 reglas, todas en `severity: "error"`**
tras la fase 6 (la regla `app-via-index` se promovió de `warn` a `error` al curar
sus 71 violaciones):

1. `shared-no-importa-features-ni-app` — `shared/` es la base.
2. `features-no-importan-app` — los features no conocen el routing.
3. `cross-feature-solo-via-index` — un feature consume otro solo por `index.ts`.
4. `app-via-index` — `app/` consume features solo por `index.ts` o `server.ts`.
5. `no-circular` — sin ciclos.

Dos **excepciones acotadas** (`pathNot`), cada una con su motivo:

- `entidades ↔ embarques`: relación bidireccional; ampliar el barrel generaba
  ciclos. Imports directos permitidos a
  `embarques/components/{banner,context,dialog/dialog-component,secciones/payload-utils}`.
  Trabajo futuro: mover esas utilidades a `shared/` y retirar la excepción.
- `combex/.../seleccionar-copias-modal.tsx`: client component que rompía server
  components al pasar por el barrel; se importa por ruta directa.

## Consequences

- **+** Las fronteras dejan de depender de la disciplina humana.
- **+** El gate falla el PR ante cualquier import ilegal o ciclo nuevo.
- **−** Las excepciones son deuda visible: documentadas en el propio archivo y en
  `docs/ARQUITECTURA.md` §4, con plan de retiro.

## Referencias

- `.dependency-cruiser.cjs`
- `.github/workflows/ci.yml` (job _Architecture boundaries_)
- `docs/ARQUITECTURA.md` §4
