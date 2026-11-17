# 0012 — Quality gates con Biome + lefthook

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

ESLint + Prettier implican dos herramientas, dos configs y un pipeline más lento.
Además, sin hooks de git, los problemas de formato/tipos/tests se descubren tarde
(en CI o en review) en vez de antes del commit/push.

## Decision

- **Biome 2** (`biome.json`) como herramienta única de **lint + format**
  (`pnpm lint` = `biome check .`, `pnpm format` = `biome format . --write`).
- **lefthook** (`lefthook.yml`) para hooks de git:
  - `pre-commit`: `biome check --write --staged --no-errors-on-unmatched` (solo
    archivos en stage; arregla y re-añade lo formateable).
  - `pre-push`: `pnpm typecheck` + `pnpm test:run`.
- CI repite los gates como red de seguridad (`.github/workflows/ci.yml`).

## Consequences

- **+** Un solo binario, un solo config, ejecución rápida.
- **+** Feedback temprano: el formato se corrige en commit; tipos y tests se
  validan antes del push.
- **+** CI y local comparten los mismos comandos (sin divergencia).
- **−** `pre-push` con `test:run` completo puede tardar en repos grandes (se
  acepta a cambio de no romper `main`).

## Referencias

- `biome.json`, `lefthook.yml`, `package.json` (`lint`, `format`, `verify`)
- `.github/workflows/ci.yml`, `docs/ARQUITECTURA.md` §9
