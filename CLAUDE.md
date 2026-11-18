# pricing-mirror

Espejo del módulo **pricing** del proyecto `erp-web` (Next.js). Se usa para trabajar con Claude sin dar acceso
al proyecto completo. Responder siempre en **español**.

## Qué es real y qué no

| Ruta                                         | Qué es                                                | ¿Se copia al proyecto real?      |
| -------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| `src/features/pricing/`, `src/features/embarques/` | Código real de los módulos                      | **Sí**, es lo único que se copia |
| `src/shared/**`, `src/features/catalogos/**` | STUBS: solo tipos de lo que pricing usa (salvo `async-combobox-input.tsx`, real) | **No** (salvo ese archivo) |
| `src/features/tracking/**`                   | STUB: solo tipos de `TrackingDetalle` (embarques)     | **No**                           |
| `src/features/objetivos/**`                  | STUB: copia del catálogo `objetivos` (Hit Rate)       | **No**                           |
| `src/types/stubs-modulos.d.ts`               | Todo lo demás de `@/shared` / `@/features` como `any` | **No**                           |
| `tsconfig.json`                              | Copia exacta del proyecto real                        | No (ya existe allá)              |

- `src/features/catalogos/create-catalogo.ts` contiene el **código real** de `createCatalogo` del proyecto.
- `src/shared/components/form/fields/async-combobox-input.tsx` contiene el **código real** de `AsyncComboboxInput`,
  idéntico al proyecto (para tipar `onOpenChange` hay stub en `src/shared/components/ui/popover.tsx`). Es la única
  ruta de `src/shared` que **sí** sale en los `diff/` (`RUTAS_CODIGO` de `scripts/guardar-diff.mjs`).
  Consulta solo con el listado abierto. Caché de 30 s, pero al abrir vuelve a pedir las opciones si `fetchOptions`
  cambió desde la última consulta: con opciones locales que cambian, pasar `fetchOptions` memoizado sobre la lista
  (`useFiltroOpciones` en Tarifas); las búsquedas en servidor memoizadas no consultan de nuevo al reabrir. Dibuja
  máximo `maxOptions` (100) opciones.
- Si un cambio necesita un tipo de `@/shared` que no está en los stubs, se agrega al stub (solo tipos) y se avisa.
- Nunca cambiar lógica dentro de los stubs para "hacer pasar" algo.
- **Embarques: se trabaja únicamente en `src/features/embarques/v2/`.** Lo demás de `src/features/embarques/`
  (`api/`, `components/`, `hooks/`, `lib/`, `index.ts`) es el módulo actual y sirve **solo como referencia** de la
  estructura existente: se lee para seguir sus patrones, pero no se modifica, no se corrigen sus errores de `tsc`
  (están en la línea base) y ningún diff lo toca.

## Versiones (iguales al proyecto real)

TypeScript 7 · React 19.3 · zod 4.6 · @tanstack/react-query 5.107 · react-table 9 · date-fns 4 · lucide-react 1.70 · Biome 2.6 ·
Next 16 (no instalado: `next/link` es stub). Referencia: `package.json` de producción de `erp-web` 2.1.0.

`tsconfig` estricto — lo que más impacta al escribir código:

- `exactOptionalPropertyTypes`: si se asigna un valor que puede ser `undefined` a una prop opcional, tiparla `?: T | undefined`
  o usar spread condicional `...(x == null ? {} : { x })`.
- `noUncheckedIndexedAccess`: `arr[0]` y `obj[clave]` pueden ser `undefined`.
- `noImplicitReturns`, `noImplicitOverride`, `strict`.

## Comandos

```bash
npm install
npm run check:nuevos            # tsc (SOLO errores nuevos vs .tsc-baseline.txt) + check:biome + check:finales (usar este)
npm run check:biome             # Biome (biome.json = copia del proyecto real) sobre pricing, embarques/v2 y async-combobox-input
npm run biome:arreglar          # aplica formato, orden de imports y arreglos seguros de Biome
npm run check:finales           # falla si un archivo cambió CRLF<->LF o si uno nuevo no está en LF
npm run check                   # tsc completo (incluye ~326 errores previos: stubs any + código existente)
npm run check:actualizar-base   # tras resolver errores previos, guardar nueva línea base
npm run diff:guardar            # tras cada commit: diff/[DDMMYY-HHmm]-[commit].diff y amend
```

Regla: **ningún cambio debe dejar errores nuevos** en `check:nuevos`. Si se resuelven errores previos, actualizar la base.

## Biome

`biome.json` es **copia exacta del proyecto real** (no editarlo aquí). En el proyecto Biome **bloquea el commit**, así que
en el espejo `check:biome` no acepta **ningún error** (no hay línea base): formato (2 espacios, ancho 100, comillas dobles,
`;`, trailing commas), imports ordenados y con `import type`, nombres de archivo en **kebab-case**, sin `any`, sin `!`,
sin `console`, sin `key` por índice, dependencias de hooks exhaustivas, `type` en `<button>`, etc.
Única excepción del espejo: se ignora `noUndeclaredDependencies` de `next` (aquí no está instalado).
El resto de `src/features/embarques/` (referencia) no se revisa.

## Finales de línea

`.gitattributes` tiene `* -text`: git guarda cada archivo tal cual. El proyecto real mezcla **CRLF y LF** por archivo.
Al editar, **conservar el final de línea que ya tiene el archivo** (no convertir). Archivos nuevos: LF.

- `check:finales` (incluido en `check:nuevos`) **bloquea** cualquier conversión CRLF<->LF; no se hace commit si falla.
- Los `diff/` son de **texto en LF** (no binarios): no dependen de los finales de línea. Se aplican **solo** con
  `scripts/aplicar-diff.mjs` (ver *Aplicar diffs*).

## Aplicar diffs (en el proyecto real)

Única forma de aplicar un `diff/`: `scripts/aplicar-diff.mjs`. Adapta el diff al final de línea de cada archivo
destino y lo deja como estaba (funciona con cualquier `core.autocrlf`). **Nunca** indicar `git apply`, `patch`
ni copiar carpetas como alternativa.

**Comando (siempre con este formato)**, desde la raíz del proyecto real, con rutas al espejo:

```bash
node <espejo>/scripts/aplicar-diff.mjs <espejo>/diff/<archivo>.diff --check
node <espejo>/scripts/aplicar-diff.mjs <espejo>/diff/<archivo>.diff
```

- Primero `--check` (no toca nada); si dice `OK`, el mismo comando sin `--check`.
- Varios diffs: **uno por uno, en orden cronológico** (el nombre `DDMMYY-HHmm` ya los ordena), cada uno con su
  `--check` antes. Si uno falla, no seguir con los siguientes.
- El script no toca nada si algo no aplica. Marca cada archivo de `Archivos en el diff:` así:
  - Sin marca → ese archivo aplica (al final dice `OK: …`).
  - **YA APLICADO** / **IGUAL AL ESPEJO** → ese archivo no necesita el diff. Si todo el diff está así dice
    "Nada que hacer" y termina sin error: seguir con el siguiente.
  - **NO APLICA** → el proyecto difiere de `main`. No forzar: pedir al usuario el archivo real y hacer un diff
    nuevo sobre ese estado (ver *Flujo de trabajo*).

**Al cerrar cada iteración**, la respuesta al usuario incluye siempre este bloque (solo diffs de esa iteración):

1. Tras aceptar el PR: `git pull` del espejo en `main`.
2. Lista numerada de diffs **en el orden de aplicación**, con el nombre completo del archivo, y para cada uno
   el par de comandos de arriba (`--check` y aplicar) en bloques `bash` separados.
3. Diffs que **no** se aplican (reemplazados, `obsoletos/`, ya aplicados) y por qué.
4. Si no hubo cambios en `src/features`: decirlo ("no hay diff que aplicar").

## Flujo de trabajo

**Proceso del usuario (no cambia):** Claude sube a la rama → el usuario hace el pull request y lo acepta →
`git pull` del espejo en su PC → aplica los `diff/` en su proyecto.

**Regla base: lo que está en `main` es lo que el usuario ya aplicó en su proyecto.** Lo que no está en `main`
no lo ha aplicado.

- Cada iteración empieza desde `origin/main` actualizado; los diffs se generan sobre ese estado.
- Si un PR ya se aceptó, lo nuevo va en commits nuevos sobre `main` (nuevo PR del usuario).
- Al terminar, decir **qué diffs aplicar y en qué orden** (solo los de esa iteración) y cuáles no, con el
  bloque de cierre de *Aplicar diffs*.
  No pasar rutas de diffs que aún no están en `main` como si ya pudieran aplicarse: el usuario los
  aplica después de aceptar el PR y hacer pull.
- Si el usuario reporta que un diff no aplicó, su proyecto quedó como estaba `main` antes de ese diff:
  la corrección se hace con un diff nuevo sobre el estado real que reporte (pedir el archivo si hace falta).


0. **Al iniciar y en cada iteración, revisar si `main` cambió**: `git fetch origin main` y
   `git log --oneline HEAD..origin/main`. Si hay commits nuevos, integrarlos a la rama (`git merge origin/main`,
   conservando finales de línea) **antes** de seguir trabajando, y avisar al usuario qué entró.
1. Trabajar en una rama; commits pequeños y en español.
2. `npm run check:nuevos` antes de cada commit.
3. Verificación proporcional al cambio: cambio chico → solo `check:nuevos`; cambio de lógica → además una prueba
   rápida en ejecución (esbuild + node) comparando contra el comportamiento anterior.
4. **Después de cada commit que cambie `src/features/pricing` o `src/features/embarques`: `npm run diff:guardar`.** Genera
   `diff/[DDMMYY-HHmm]-[nombre-del-commit].diff` (hora de Guatemala, solo `src/features/pricing` y `src/features/embarques`, texto en LF)
   y lo agrega al mismo commit (amend). Hacerlo antes del push.
5. El usuario lo aplica con `scripts/aplicar-diff.mjs`, siguiendo *Aplicar diffs* (formato fijo del comando
   y del bloque de cierre).
6. Actualizar el `ARQUITECTURA.md` del submódulo si cambia dónde vive algo.
7. **Registrar cada cambio en `CAMBIOS.md`** (log de cambios, en la raíz) en el mismo commit: entrada nueva arriba,
   bajo la fecha del día (`## DD/MM/AAAA`), con rama, módulo/submódulo, qué se hizo y por qué, y el nombre del
   archivo `diff/` si se generó. Sirve para dar seguimiento a lo hecho entre sesiones; leerlo al iniciar.

## Convenciones del módulo

Leer primero la guía del submódulo:

- `src/features/pricing/cotizacion/calculo/ARQUITECTURA.md`
- `src/features/pricing/tarifas/ARQUITECTURA.md`
- `src/features/embarques/v2/general/ARQUITECTURA.md` (embarques: solo `v2/`, el resto es referencia)

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
- **Toasts de mutaciones** (ADR-0005): `meta: { successMessage }` / `meta: { silent: true }`, nunca toasts a mano.
  Una acción = un toast: si una acción hace varias mutaciones, el mensaje va en una sola (crear tarifa → método).
  Si el backend responde `success: false`, `exigirExitoDeMutacion(respuesta, contexto)` en el `mutationFn`
  (`@/shared/api/respuesta-mutacion`; si no, sale el toast de éxito).
  Validaciones que se resuelven en pantalla van **antes** de la mutación (`validarAntesDeGuardar`).
  Si la pantalla ya muestra el resultado o el error, `silent: true` (carga masiva, reactivar cabecera).
  Tipos de `meta`: `Register` en `src/shared/lib/tanstack/query-client.ts` (`successMessage` acepta string o `(data) => string`).
- `CotizacionForm` y `FichaResumen` se usan fuera de sus pantallas (Autorización Spot, Plantillas, Tarifas):
  no depender solo de providers ahí.

## Pendientes (optimización, no urgentes)

Viven como **issues con la etiqueta `backlog`** (ver *Issues y etiquetas*); no se listan aquí para no duplicar:
#95 dividir archivos grandes del cálculo · #96 tipo `Rubro` · #97 decisiones por texto → constantes ·
#98 formularios de equipo/rango/scalling a `<CampoMetodo>` · #99 `crear-api-metodo.ts` sin uso ·
#100 `porcentaje-form.tsx` con `minimo: 0` · #101 `tarifas/api/monedas.ts` → catálogo `monedas`.

## Issues y etiquetas (control de pedidos)

Cada pedido del usuario se lleva en un **issue** de GitHub (`LigiaAb/pricing-mirror`).

1. **Al recibir un pedido**: buscar si ya hay un issue (abierto o cerrado); si no, crearlo con título
   `Submódulo: qué`, descripción (qué, por qué, criterios, decisiones pendientes) y etiquetas. Al empezar, `en-progreso`.
2. **Commits**: título `CLDDMMYYYY ACCION` igual que siempre y, en el cuerpo, `Closes #N` (o `Refs #N` si el
   issue sigue abierto después). GitHub lo cierra al aceptar el PR: **issue cerrado = en `main` = aplicado**.
3. **Al terminar la iteración**: comentar en el issue la rama, los diffs en orden de aplicación y el resultado de
   `check:nuevos`; cambiar `en-progreso` → `listo-para-pr`. La entrada de `CAMBIOS.md` lleva `(#N)`.
4. **Si un diff no aplica**: reabrir el issue (o uno nuevo que lo enlace) con lo que reportó el usuario.
5. Al iniciar sesión, revisar los issues abiertos junto con `CAMBIOS.md`.

Etiquetas (una de cada grupo; GitHub las crea al asignarlas, colores en *Issues → Labels*):

| Grupo  | Etiquetas |
| ------ | --------- |
| Módulo | `pricing:cotizacion`, `pricing:tarifas`, `pricing:autorizacion-spot`, `pricing:plantillas`, `pricing:reportes`, `pricing:carga-masiva`, `pricing:shared`, `embarques:general`, `embarques:operaciones`, `embarques:bodegas`, `embarques:combex`, `reglas` (espejo, scripts, `CLAUDE.md`) |
| Tipo   | `mejora`, `bug`, `refactor` (sin cambio de lógica), `sync` (validar un SYNC), `calidad` (Biome, `tsc`, finales de línea) |
| Estado | `en-progreso`, `listo-para-pr`, `bloqueado` (falta algo del usuario), `backlog` (no urgente, sin empezar) |

usar la rama con formato claude/[fecha con formato DDMMYYYY]-work-[modulo]-[submodulo]

en commits agregar titulo CL[fecha en formato DDMMYYY] ACCION
