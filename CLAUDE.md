# pricing-mirror

Espejo del módulo **pricing** del proyecto `erp-web` (Next.js). Se usa para trabajar con Claude sin dar acceso
al proyecto completo. Responder siempre en **español**.

## Qué es real y qué no

| Ruta                                         | Qué es                                                | ¿Se copia al proyecto real?      |
| -------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| `src/features/pricing/`                      | Código real del módulo                                | **Sí**, es lo único que se copia |
| `src/shared/**`, `src/features/catalogos/**` | STUBS: solo tipos de lo que pricing usa               | **No**                           |
| `src/types/stubs-modulos.d.ts`               | Todo lo demás de `@/shared` / `@/features` como `any` | **No**                           |
| `tsconfig.json`                              | Copia exacta del proyecto real                        | No (ya existe allá)              |

- `src/features/catalogos/create-catalogo.ts` contiene el **código real** de `createCatalogo` del proyecto.
- Si un cambio necesita un tipo de `@/shared` que no está en los stubs, se agrega al stub (solo tipos) y se avisa.
- Nunca cambiar lógica dentro de los stubs para "hacer pasar" algo.

## Versiones (iguales al proyecto real)

TypeScript 7 · React 19 · zod 4 · @tanstack/react-query 5.105 · react-table 9 · date-fns 4 · Next 16 (no instalado: `next/link` es stub).

`tsconfig` estricto — lo que más impacta al escribir código:

- `exactOptionalPropertyTypes`: si se asigna un valor que puede ser `undefined` a una prop opcional, tiparla `?: T | undefined`
  o usar spread condicional `...(x == null ? {} : { x })`.
- `noUncheckedIndexedAccess`: `arr[0]` y `obj[clave]` pueden ser `undefined`.
- `noImplicitReturns`, `noImplicitOverride`, `strict`.

## Comandos

```bash
npm install
npm run check:nuevos            # tsc y SOLO errores nuevos vs .tsc-baseline.txt (usar este)
npm run check                   # tsc completo (incluye ~326 errores previos: stubs any + código existente)
npm run check:actualizar-base   # tras resolver errores previos, guardar nueva línea base
npm run diff:guardar            # tras cada commit: diff/[DDMMYY-HHmm]-[commit].diff y amend
```

Regla: **ningún cambio debe dejar errores nuevos** en `check:nuevos`. Si se resuelven errores previos, actualizar la base.

## Finales de línea

`.gitattributes` tiene `* -text`: git guarda cada archivo tal cual. El proyecto real mezcla **CRLF y LF** por archivo.
Al editar, **conservar el final de línea que ya tiene el archivo** (no convertir). Archivos nuevos: LF.

## Flujo de trabajo

1. Trabajar en una rama; commits pequeños y en español.
2. `npm run check:nuevos` antes de cada commit.
3. Verificación proporcional al cambio: cambio chico → solo `check:nuevos`; cambio de lógica → además una prueba
   rápida en ejecución (esbuild + node) comparando contra el comportamiento anterior.
4. **Después de cada commit que cambie `src/features/pricing`: `npm run diff:guardar`.** Genera
   `diff/[DDMMYY-HHmm]-[nombre-del-commit].diff` (hora de Guatemala, solo `src/features/pricing`, formato binario que
   conserva CRLF/LF) y lo agrega al mismo commit (amend). Hacerlo antes del push.
5. El usuario aplica ese archivo en la raíz de su proyecto con `git apply diff/<archivo>.diff`
   (o copia `src/features/pricing`).
6. Actualizar el `ARQUITECTURA.md` del submódulo si cambia dónde vive algo.

## Convenciones del módulo

Leer primero la guía del submódulo:

- `src/features/pricing/cotizacion/calculo/ARQUITECTURA.md`
- `src/features/pricing/tarifas/ARQUITECTURA.md`

Resumen:

- **APIs**: usar `createCatalogo` de `@/features/catalogos` (estándar del proyecto). En Tarifas, los métodos usan
  `crearCatalogoMetodo` (`tarifas/api/catalogo-metodo.ts`), un adaptador delgado (filtros camelCase, eliminar = `cod_estado: 4`, payload tipado).
- **Cotizaciones**
  - Catálogos: `useCatalogosCotizacion()` (provider en `GestionCotizacion`); no pasar catálogos por props.
  - Campos de la cabecera: definición única en `lib/cabecera.ts` (`CAMPOS_CABECERA`).
  - Tipos compartidos `lib/tipos.ts`; funciones `lib/utils.ts`; códigos de negocio `lib/constantes.ts`;
    componentes reutilizables `components/utils.tsx`.
  - Detalle de flete por transporte: `lib/detalle-flete.ts` (`null` = ese transporte no lleva detalle).
  - Estados: `useEstadosCalculo()` dentro del cálculo (el container valida que existan).
- **Calculadora de embarques** (`pricing/shared/calculadora-embarque/`, con sus propias `components/`, `hooks/`, `lib/`): corporativa, lee sus unidades sola
  (`useUnidadesEmbarque`); cada módulo solo adapta sus filas guardadas y decide qué hacer en `onAplicar`.
- **Tarifas**
  - Campos de los métodos: definición única en `lib/metodos/<metodo>.ts` (`definirMetodo`; rango en
    `pricing/shared/lib/metodos/rango.ts`). Agregar un campo = 1 línea en `campos` + `<CampoMetodo>` en su
    `-form.tsx` si se ve (+ su código en `columnasMetodo` si va en tabla). Ver `tarifas/ARQUITECTURA.md`.
  - Monedas: `useMonedasOperativas()`; opciones de select y búsqueda local en `hooks/use-opciones-tarifa.ts`.
  - Helpers en `lib/tarifa-helpers.ts`.

## Trampas conocidas

- **Fechas + React Query**: datos con `Date` (ej. métodos usa `z.coerce.date()`) rompen el structural sharing; cada
  recarga entrega arreglos nuevos. Tablas TanStack regresan a la página 1 → usar `useReferenciaEstable(data)`
  (`tarifas/hooks/use-referencia-estable.ts`).
- Funciones devueltas por hooks y usadas en `useMemo` de tablas deben estar memoizadas (ej. `mapWithCatalogo`).
- Equipo (tarifas) usa `value` numérico en monedas porque se envía tal cual al backend.
- `CotizacionForm` y `FichaResumen` se usan fuera de sus pantallas (Autorización Spot, Plantillas, Tarifas):
  no depender solo de providers ahí.

## Pendientes (optimización, no urgentes)

- Archivos grandes por dividir: `cotizacion/calculo/lib/totales-rubros.ts`, `hooks/use-formulario-cotizacion.ts`,
  `components/calculo-cotizacion.tsx`.
- Tipo `Rubro` claro para Due Agent / Due Carrier / Totales (hoy `Record<string, unknown>` y casts).
- Decisiones por texto (`=== "TERRESTRE"`, `"IVA"`, `includes("FLETE")`) → códigos en `constantes.ts`.
- Tarifas: los formularios de equipo, rango y scalling (y el input de venta de costo-porcentaje) siguen a mano;
  podrían pasar a `<CampoMetodo>` si se acepta unificar su markup (placeholders, asteriscos, "" vs null).
- `tarifas/api/crear-api-metodo.ts` no se usa.
- `tarifas/.../porcentaje-form.tsx` inicializa `minimo: 0` en vez de `minimo_costo` / `minimo_venta`.
- `tarifas/api/monedas.ts` podría reutilizar el catálogo `monedas` de `@/features/catalogos`.

usar la rama con formato claude/[fecha con formato DDMMYYYY]-work-[modulo]-[submodulo]

en commits agregar titulo CL[fecha en formato DDMMYYY] ACCION
