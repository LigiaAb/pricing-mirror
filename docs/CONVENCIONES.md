# Convenciones del proyecto

Referencia normativa. El detalle y la justificación viven en [ARQUITECTURA.md](./ARQUITECTURA.md) y los [ADRs](./adr/).

## Idioma

- **Sustantivos de dominio en español** (lenguaje ubicuo del negocio): `embarque`, `coordinacion`, `gasto`, `entidad`.
- **Verbos y sufijos técnicos en inglés**: `use`, `create`, `Schema`, `Store`, `Provider`.
- **Sin tildes ni eñes en identificadores**: `coordinacion`, no `coordinación`.

## Naming de archivos y exports

| Artefacto      | Archivo                                                              | Export               | Ejemplo                                            |
| -------------- | -------------------------------------------------------------------- | -------------------- | -------------------------------------------------- |
| Carpetas       | kebab-case                                                           | —                    | `carta-instrucciones/`                             |
| Componentes    | kebab-case `.tsx`                                                    | PascalCase           | `tarjeta-coordinacion.tsx` → `TarjetaCoordinacion` |
| Hooks          | `use-*.ts(x)`                                                        | camelCase            | `use-entidad-form.ts` → `useEntidadForm`           |
| Stores zustand | `*-store.ts`                                                         | camelCase            | `contexto-operativo-store.ts`                      |
| Schemas zod    | kebab-case                                                           | camelCase + `Schema` | `moneda-schema.ts` → `monedaSchema`                |
| Tipos          | junto al schema                                                      | PascalCase           | `Moneda` (`z.infer`)                               |
| Constantes     | kebab-case                                                           | SCREAMING_SNAKE      | `CACHE_STATIC`                                     |
| Rutas URL      | kebab-case                                                           | —                    | `/carta-instrucciones`                             |
| Tests          | `*.test.ts(x)` centralizados en `tests/vitest/**` (espejo de `src/`) | —                    | `tests/vitest/shared/api/envelope.test.ts`         |

## Receta: estructura de `api/` de una feature

La ola de migración de julio entró con estilos distintos dentro de `api/`
(nombres camelCase en `cxc/api/asignacionAgente.ts`, mezcla de convenciones
en otros módulos). Para módulos nuevos o al tocar uno existente, `api/`
sigue esta forma — no todos los archivos aplican a toda feature, pero el
que exista usa este nombre y este rol:

| Archivo                                 | Rol                                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemas.ts`                            | Schemas zod del envelope de esa feature; los tipos se derivan con `z.infer`, nunca a mano.                                                       |
| `types-api.ts`                          | Tipos "raw" del wire (forma cruda del backend) cuando difieren del dominio — solo si `mappers.ts` los necesita.                                  |
| `mappers.ts`                            | Funciones puras `raw → dominio` (y de vuelta si aplica). Sin I/O.                                                                                |
| `use-fetch-<entidad>.ts` / `queries.ts` | Hooks TanStack Query de lectura. Un archivo por query si el fetch tiene lógica propia; `queries.ts` si son varias queries triviales de catálogo. |
| `use-<entidad>-mutations.ts`            | Hooks TanStack Query de escritura, con `meta: { silent, successMessage }` en vez de toasts manuales.                                             |
| `server-fetch.ts`                       | Solo si la feature tiene un Server Component propio (ver `coordinaciones/api/`); usa `serverHttp`, nunca `http`/`httpPublic`.                    |

Las Server Actions solo se justifican para escribir cookies; las mutaciones van
con hook de TanStack Query sobre `http`
([ADR-0016](./adr/0016-mutaciones-tanstack-server-actions-cookies.md)).

Naming de archivo: kebab-case siempre (tabla de arriba), incluso para los
que ya existen en camelCase — renombrar al tocarlos, sin alias de
compatibilidad (prohibición ya vigente).

Catálogos simples usan la factory `createCatalogo` (ver
[ADR-0008](./adr/0008-factory-create-catalogo.md)) en vez de repetir este
patrón a mano.

## Arquitectura (objetivo feature-first)

- `app/` → solo routing; importa de `features/*` vía su `index.ts` y de `shared/`.
- `features/*` → importa de `shared/` y de otros features solo vía `index.ts`.
- `shared/` → **nunca** importa de `features/` ni `app/`.
- Sin ciclos entre módulos.
- Un feature no importa su propio `index.ts` (crea ciclos): usa el módulo directo.
- `pricing/` es un grupo: cada sub-feature (`tarifas/`, `autorizacion-spot/`, …) tiene su `index.ts`.
- La regla Biome `noImportCycles` bloquea ciclos en CI. `.dependency-cruiser.cjs`
  define las fronteras, aunque sale ciego bajo TS7.

### Cuándo un `index.ts` es legítimo

Un `index.ts` existe para **cerrar una frontera**, no para ahorrar
teclas al importar. Solo dos casos:

1. **Frontera de dominio** — `features/<dominio>/index.ts`. Define qué
   puede consumir el resto del repo y esconde lo interno.
2. **Cara pública de un componente partido** — p. ej.
   `shared/components/ui/sidebar.tsx` sobre `ui/sidebar/*`. Las piezas se
   partieron por límite de tamaño de archivo, se usan siempre juntas y el
   split es detalle de implementación.

Fuera de eso, **agregar una carpeta plana en un `index.ts` está
prohibido** (ver Prohibiciones). En `shared/components/` se importa por
subpath: `@/shared/components/ui/button`, no `@/shared/components/ui`.

## Prohibiciones

- `export *` (regla Biome `noReExportAll`; overrides legacy se eliminan en Fase 4).
- **Barrels agregadores de carpeta**: un `index.ts` que reexporta los
  vecinos de su directorio sin cerrar una frontera (ver _Cuándo un
  `index.ts` es legítimo_). Se eliminó `shared/components/ui/index.ts`
  por esto: quedaba desactualizado (6 de 34 componentes nunca llegaron a
  estar en él, así que un mismo archivo importaba mitad barrel mitad
  subpath), inflaba el ruido de `knip` en 124 exports muertos falsos, y
  bastaba una línea nueva para arrastrar `cmdk`, `react-day-picker` o
  CodeMirror a todo consumidor, contra la regla de >50KB de Rendimiento.
- `process.env` directo fuera de `shared/config/env.ts` (desde Fase 1).
- `catch` silencioso que trague errores (`catch { return [] }`): el error llega al boundary o al handler global del QueryClient.
- Toasts hardcodeados en call sites de queries/mutations: usar `meta: { silent, successMessage }`.
- Archivos en kebab-case (`useFilenamingConvention`), incluidos los tests.
- Alias de código / re-exports de compatibilidad. Para URLs viejas: `redirects()` en `next.config.ts`.
- Tipos duplicados a mano cuando existe schema zod: el tipo es `z.infer<typeof schema>`.

## Rendimiento

- Librería de cliente >50KB → `next/dynamic` o `await import()` lazy, salvo justificación documentada.
  Patrón de referencia: `exceljs`/`jspdf` vía `shared/hooks/use-dynamic-libraries.ts`.
- Tablas con >100 filas potenciales → virtualización (`@tanstack/react-virtual` vía `data-table`).
- Defaults de TanStack Query: ver `shared/lib/tanstack/query-client.ts` — overrides por query, no globales ad-hoc.

## Accesibilidad (checklist por PR)

- Botón-icono → `aria-label`.
- Todo input con label asociado (usar `FormLabel`/Radix `Label`).
- Dialogs, popovers y menús custom **solo** sobre primitives Radix (focus management y ARIA resueltos).
- Contraste AA en tokens nuevos de `globals.css`.
- Reglas Biome `a11y` en `error`: no se mergea con violaciones.

## Commits

Convención, no gate (D-35: el hook `commit-msg` se retiró — equipo IT,
2026-08-02 — prioridad de velocidad sobre bloquear cada commit local):

```
tipo(ámbito): descripción en minúsculas, en español de dominio
```

- **tipo**: `feat` | `fix` | `refactor` | `docs` | `test` | `chore` | `ci` | `perf`.
- **ámbito** (opcional): el feature o área tocada — `embarques`, `carta-instrucciones`, `ci`, `seguridad`.
- **Mínimo 10 caracteres de descripción** tras los dos puntos.
- Evitar `test`, `prueba(s)`, `cambios`, `wip` como primera línea: no dicen
  qué cambió (causaron main rojo sin trazabilidad).
- La descripción dice **qué cambia para el sistema**, no "cambios varios".
  Cuerpo libre si hace falta el porqué.
- Ejemplos reales: `feat(embarques): wizard público /public/cts completo`,
  `chore(ci): cache de .next/cache en el build`.

## Política de ramas

- Rebase sobre `main` antes de abrir el PR.
- CI verde en la rama **antes** de pedir review — nadie mergea "mientras corre".
- Borrar la rama tras el merge.

## Quality gates

Estado real verificado 2026-08-28 (detalle y tabla en
[ARQUITECTURA.md §9](./ARQUITECTURA.md#9-cicd-y-quality-gates)):

- **Pre-commit** (lefthook): `biome check --write --staged`.
- **Pre-push** (lefthook): solo `pnpm typecheck`. No corre `depcruise` ni
  `knip` en pre-push hoy (a diferencia de una configuración anterior).
- **CI** (`checks` en matriz + `gitleaks`): `typecheck`, `lint:ci`
  (`biome ci --error-on-warnings`, no escribe), `check:top-levels` y el secret scan.
  Todos bloqueantes.
- `knip`, `depcruise`, `check:security-invariants`, `check:bundle-size` y
  `pnpm build` **no corren en CI ni en los hooks** desde la reducción de
  gates del 2026-08-03 — siguen como scripts de `package.json` para uso
  manual/local. `depcruise` en particular está roto bajo TypeScript 7 (sale
  ciego, 0 módulos cruzados — no hagas bump de `typescript` sin verificar
  compatibilidad antes). `check:security-invariants` falla hoy en local; no
  hay gate que lo detecte hasta que se re-habilite.
- Tests (`vitest`, Playwright E2E) no son obligatorios en CI; quedan
  disponibles para desarrollo local con `pnpm test`/`pnpm test:run`/
  `pnpm verify`/`pnpm test:e2e`. El PR template pide declarar qué se probó a
  mano en su lugar.
- Archivos nuevos ≤500 líneas; los ya baselined **no pueden crecer** respecto
  a su tamaño registrado (ver [ADR-0011](./adr/0011-guard-tamano-archivo.md)),
  pero `check:file-size` no corre en CI hoy — es responsabilidad del PR
  hasta que el gate vuelva.
