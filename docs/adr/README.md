# Architecture Decision Records (ADRs)

Registro de decisiones de arquitectura de **erp-web**. Formato MADR-lite:
**Status / Context / Decision / Consequences**. Un archivo por decisión,
numerado `NNNN-titulo-kebab.md`. Una vez aceptada, una ADR no se reescribe: si
cambia, se crea una nueva que la supersede y se actualiza el `Status` de la vieja.

Visión global en [`docs/ARQUITECTURA.md`](../ARQUITECTURA.md).

| #                                                            | Decisión                                                        | Status   |
| ------------------------------------------------------------ | --------------------------------------------------------------- | -------- |
| [0001](./0001-arquitectura-feature-first-barrels.md)         | Arquitectura feature-first con barrels `index.ts` curados       | Aceptado |
| [0002](./0002-fronteras-dependency-cruiser.md)               | Fronteras de dependencias con dependency-cruiser                | Aceptado |
| [0003](./0003-envelope-parse-envelope.md)                    | Envelope + `parseEnvelope`/`unwrapEnvelope`                     | Aceptado |
| [0004](./0004-trio-adaptadores-http.md)                      | Trío de adaptadores HTTP                                        | Aceptado |
| [0005](./0005-tanstack-query-meta.md)                        | TanStack Query: cache global + `meta`                           | Aceptado |
| [0006](./0006-sesion-expirada-error.md)                      | `SesionExpiradaError` y flujo `onSesionExpirada`                | Aceptado |
| [0007](./0007-tipos-derivados-zod.md)                        | Tipos derivados de Zod (`z.infer`)                              | Aceptado |
| [0008](./0008-factory-create-catalogo.md)                    | Factory `createCatalogo` para catálogos CRUD                    | Aceptado |
| [0009](./0009-ratchet-coverage.md)                           | Ratchet de coverage (real − 2pts)                               | Aceptado |
| [0010](./0010-barrel-server-ts-fetchers-server-only.md)      | Barrel hermano `server.ts` para fetchers `server-only`          | Aceptado |
| [0011](./0011-guard-tamano-archivo.md)                       | Guard de tamaño de archivo (≤ 500 líneas)                       | Aceptado |
| [0012](./0012-quality-gates-biome-lefthook.md)               | Quality gates con Biome + lefthook                              | Aceptado |
| [0013](./0013-suite-e2e-playwright-axe.md)                   | Suite E2E con Playwright + mocking hermético + axe-core         | Aceptado |
| [0014](./0014-react-compiler.md)                             | Adopción de React Compiler                                      | Aceptado |
| [0015](./0015-cabeceras-seguridad-csp.md)                    | Cabeceras de seguridad HTTP (CSP con nonce en `src/proxy.ts`)   | Aceptado |
| [0016](./0016-mutaciones-tanstack-server-actions-cookies.md) | Mutaciones con TanStack Query; Server Actions solo para cookies | Aceptado |
