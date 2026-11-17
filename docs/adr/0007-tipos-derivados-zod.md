# 0007 — Tipos derivados de Zod (`z.infer`), sin duplicar a mano

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

Cuando el tipo TypeScript de una entidad y su validación en runtime se mantienen
por separado, divergen: un campo nuevo en el schema no se refleja en el tipo, o
al revés. El frontend valida las respuestas del backend (ver
[ADR-0003](./0003-envelope-parse-envelope.md)), así que el schema zod ya existe y
es la fuente de verdad natural.

## Decision

Definir cada forma de datos como un **schema zod** y **derivar el tipo** con
`z.infer<typeof schema>`. No se escriben interfaces/tipos paralelos a mano para
datos que ya tienen schema.

- Validación (runtime) y tipo (compile-time) provienen de la misma definición.
- Zod v4 en todo el repo; los scalars comunes se centralizan en
  `src/shared/lib/zod-scalars.ts`.

## Consequences

- **+** Imposible que el tipo y la validación se desincronicen.
- **+** Menos código: una definición en vez de dos.
- **−** Acopla los tipos a zod (aceptable: zod es dependencia central).
- **−** Para respuestas sin schema (legacy) el tipo sigue siendo manual hasta
  que se modele el schema.

## Referencias

- `src/shared/lib/zod-scalars.ts`
- `src/features/*/api/*schema*.ts`
- `docs/CONVENCIONES.md`
