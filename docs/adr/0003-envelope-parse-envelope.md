# 0003 — Envelope + `parseEnvelope`/`unwrapEnvelope`

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

El backend REST envuelve sus respuestas en un **sobre** con forma habitual
`{ data: { success, mensaje, cod_mensaje, data: T[] } }`, y variantes históricas
(`{ data: T[] }` y `T[]` a secas). Desenvolver ese sobre a mano en cada hook era
repetitivo y propenso a errores; además, un cambio de contrato en el backend
pasaba inadvertido hasta producción.

## Decision

Modelar el sobre **una sola vez** en `src/shared/api/envelope.ts` y exponer dos
funciones:

- `unwrapEnvelope<T>(data)` — desenvuelve sin validar la forma (uso legacy /
  datos sin schema).
- `parseEnvelope(data, schema, contexto)` — desenvuelve **y valida** cada item
  con un schema zod:
  - en `development`: lanza `EnvelopeInvalidoError` (el contrato se rompió → se
    arregla el schema o el backend).
  - en producción: reporta a Sentry y devuelve solo los items válidos (la vista
    no se cae con datos parciales).

**Regla**: el sobre se parsea **solo** vía `parseEnvelope`/`unwrapEnvelope`; nunca
se desestructura `response.data.data` a mano en los features.

## Consequences

- **+** Un único punto de verdad para el contrato del sobre.
- **+** El desajuste de contrato se detecta en dev (falla ruidosa) sin tumbar
  producción (degradación elegante + telemetría).
- **+** Los tipos de datos derivan del mismo schema zod ([ADR-0007](./0007-tipos-derivados-zod.md)).
- **−** Hay que pasar siempre un `contexto` legible para que el reporte a Sentry
  sea accionable.

## Referencias

- `src/shared/api/envelope.ts`, `src/shared/api/errors.ts` (`EnvelopeInvalidoError`)
- `CLAUDE.md` (Convenciones, Prohibiciones)
- `docs/ARQUITECTURA.md` §5
