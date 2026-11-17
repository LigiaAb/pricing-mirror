# 0011 — Guard de tamaño de archivo (≤ 500 líneas)

- **Status**: Aceptado
- **Fecha**: 2026-06 (introducido en fase 5); límite actualizado a 500 líneas el 2026-07-23.

## Context

Los archivos muy largos concentran responsabilidades, dificultan la revisión y
suelen esconder lógica no testeada. Sin un límite objetivo, el tamaño crece sin
fricción.

## Decision

Un **guard de tamaño** (`scripts/check-file-size.mjs`, comando `pnpm check:file-size`,
job _File size guard_ en CI) que falla si un archivo supera **500 líneas**.

- Se acompaña de un **baseline** (`scripts/file-size-baseline.txt`) con los
  archivos heredados que aún exceden el límite: el guard bloquea **nuevas**
  violaciones, no las preexistentes, que se van reduciendo de forma incremental.

## Consequences

- **+** Presiona a extraer responsabilidades y a testear las piezas extraídas.
- **+** No bloquea el repo de golpe gracias al baseline.
- **−** El baseline es deuda explícita que hay que ir vaciando.
- **−** El límite es heurístico (un archivo de 520 líneas no es necesariamente
  "malo"); se acepta como señal, no como dogma.

## Referencias

- `scripts/check-file-size.mjs`, `scripts/file-size-baseline.txt`
- `package.json` (`check:file-size`), `.github/workflows/ci.yml`
