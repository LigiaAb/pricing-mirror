# 0009 — Ratchet de coverage (real − 2pts, exclusiones documentadas)

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

Un objetivo de cobertura fijo y alto (p. ej. "80% global") es contraproducente en
un repo que parte de cobertura baja: bloquea todo PR hasta un esfuerzo masivo, e
incentiva tests de relleno. A la vez, sin candado la cobertura solo baja.

## Decision

**Ratchet**: tras cada fase se mide la cobertura real y se fija el threshold en
`real − 2pts` (margen para fluctuaciones) en `vitest.config.mts`. Nunca se baja un
candado ya alcanzado.

Estado tras fase 6-A (provider istanbul):

| Métrica    | Real   | Candado |
| ---------- | ------ | ------- |
| lines      | 62.4%  | 60      |
| branches   | 58.6%  | 56      |
| statements | 61.44% | 59      |
| functions  | 54.53% | 52      |
- Único glob reforzado: `src/shared/api/**` al 90% (núcleo crítico).
- **Exclusiones documentadas**: el `exclude` lista, con su motivo en comentario,
  lo que no aporta señal de cobertura: barrels (`**/index.ts`, `**/server.ts`),
  PDF/canvas (no testeable en jsdom), SSE, `page.tsx`/`loading.tsx` de routing,
  thin wrappers de UI.
- El 70% global de `statements` (meta del programa maestro) queda como **trabajo
  futuro fuera de las 6 fases**: no se inventan globs de 90% sin justificación.

## Consequences

- **+** La cobertura solo puede subir; cada fase deja un piso más alto.
- **+** Progreso incremental y realista, sin bloquear el flujo.
- **−** El ratchet hay que actualizarlo a mano tras medir (paso explícito del plan).
- **−** Las exclusiones requieren disciplina: lo que se refactoriza sale de la
  lista y se testea.

## Referencias

- `vitest.config.mts` (`thresholds`, `exclude`)
- `docs/ARQUITECTURA.md` §8 (testing)
