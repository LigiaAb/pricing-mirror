# 0013 — Suite E2E con Playwright + mocking hermético + `@axe-core/playwright`

- **Status**: Aceptado (implementación completada en fase 6; 5 specs en `tests/e2e/` + job `e2e.yml`)
- **Fecha**: 2026-06 (Status actualizado 2026-07-02)

## Context

El plan de calidad contempla un gate E2E + accesibilidad que falta desde el
inicio. Los tests de Vitest cubren unidades y componentes, pero no validan flujos
completos (login, navegación por permisos, CRUD, cambio de estado, sesión
expirada) ni accesibilidad sobre el DOM renderizado real.

## Decision (propuesta)

Suite **Playwright** en `tests/e2e/` con **5 specs** sobre **mocks herméticos**:

- Mocking vía `page.route` envolviendo cualquier payload en el envelope real
  (helper `mockEnvelope`, ver [ADR-0003](./0003-envelope-parse-envelope.md)); CI
  sin backend real.
- Fixtures: sesión autenticada (cookie `auth-token` + seed de `auth-storage`),
  árbol de permisos mock.
- Specs: `login`, `navegacion-permisos`, `catalogo-crud`, `coordinacion-estado`,
  `sesion-expirada`.
- Gate de **accesibilidad** con `@axe-core/playwright` al final de cada spec
  (`expect(results.violations).toEqual([])`).
- Job `e2e` propio en CI (chromium), en paralelo al job `ci`.

## Estado actual

- ✅ `@playwright/test` y `playwright.config.ts` ya presentes.
- ⛔ `@axe-core/playwright`, `tests/e2e/`, script `test:e2e` y job CI `e2e`: **aún
  no implementados** (placeholder `tests/example.spec.ts` pendiente de borrar).

Diseño detallado en este ADR. Esta ADR pasará a **Aceptado** al
completar el área C.

## Consequences

- **+** Cubre flujos críticos de punta a punta y accesibilidad, de forma
  determinista (sin backend).
- **−** La instalación de browsers de Playwright es pesada → job CI propio con su
  caché.
- **−** Los mocks herméticos deben mantenerse en sync con el contrato del envelope.

## Referencias

- `playwright.config.ts`
- `docs/ARQUITECTURA.md` §8, §9
