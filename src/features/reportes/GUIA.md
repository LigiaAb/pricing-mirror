# Guía: agregar un reporte

Paso a paso para agregar un reporte a la pantalla de Reportes. La arquitectura (qué hace cada
archivo) está en `ARQUITECTURA.md`; aquí solo lo que hay que hacer.

## Cómo funciona (leer primero)

Un reporte es **un solo archivo** que exporta `definirReporte({ … })`. Cada propiedad de ese
objeto es una parte de la pantalla. Las que **no** se ponen usan lo de siempre; para cambiar
una, se escribe una función **en el mismo archivo, arriba**, y se pone en su propiedad:

| Propiedad      | Si no se pone / lo de siempre               | Personalizada (función del mismo archivo)    |
| -------------- | ------------------------------------------- | -------------------------------------------- |
| `consultar`    | (obligatoria) `consultarApi(endpoint, schema)` | `consultar: miConsulta`                   |
| `filtros`      | sin filtros extra                           | atajos (`filtroUsuario`…) o un filtro propio |
| `Contenido`    | tabla con las `columnas`                    | `Contenido: MiVista` (archivo `.tsx`)        |
| `descargas`    | solo "Excel agrupado"                       | `excel: true` / `pdf: true` o funciones propias |
| `fechas`       | `"requeridas"` (mes actual)                 | `"opcionales"` / `"ninguna"`                 |

Nada de esto se configura en otro lado: no hay que tocar la pantalla ni otros archivos (salvo
registrarlo, paso 3).

> **Qué NO hay que hacer** (lo pone la pantalla sola):
>
> - **Empresa y Centro de costo**: NO van en `filtros`. La pantalla los agrega a todos los
>   reportes según el permiso "Filtrar Empresa Centro Costo" (opción "Reportes") y siempre los
>   manda en la consulta (`cod_empresa`, `cod_cc`). Si el reporte no los usa:
>   `empresaCentroCosto: false`.
> - **Fechas**: no son un filtro; se configuran con `fechas`.
> - **Botón Consultar, "Personaliza tu reporte", "Resumen agrupado" y "Excel agrupado"**: salen
>   solos para todos los reportes.

## Checklist

1. [ ] **Base de datos**: `TIPO` del reporte y su relación con rol/CC/módulo (paso 1).
2. [ ] **Archivo** del reporte: copiar una plantilla y cambiar las líneas `// CAMBIAR` (paso 2).
3. [ ] **Registro**: una línea en `definiciones/<modulo>/index.ts` (paso 3).
4. [ ] `npm run check:nuevos` sin errores (si Biome se queja del formato: `npm run biome:arreglar`).
5. [ ] Probarlo: elegir el módulo y el reporte, pulsar **Consultar**.

---

## Paso 1 — Base de datos

1. Un registro en `TIPO`:
   - `TIPO_TABLA = 'REPORTE'`, `ESTADO_ID = 1`.
   - `TIPO_DESCRIPCION` = **título en pantalla** (ej. "Ventas por cliente").
   - `NOMENCLATURA` = **clave que une la base de datos con el código** (máximo 20 caracteres):
     `[MÓDULO EN 3 CARACTERES]-[INICIALES DEL REPORTE]-[CORRELATIVO DEL MÓDULO]`, correlativo de
     2 dígitos, sin contar "de" en las iniciales. Ej. `PRI-HR-01`, `CRM-OA-04`. Ver los usados
     en `definiciones/<modulo>/index.ts`.
2. Filas en `REPORTE_X_CC_X_MDULO_X_ROL` (`REPORTE_TIPO_ID` = el `TIPO_ID` de arriba) con
   `ROL_ID`, `EMPRESA_ID`, `CENCOS_ID` y `MODULO_ID`; `NULL` = todos.

Sin esto el reporte no aparece en el select, aunque el código esté listo.

## Paso 2 — Archivo del reporte

**Copiar una plantilla** de `definiciones/plantillas/` a la carpeta del módulo
(`definiciones/crm/`, `definiciones/pricing/`…; si no existe, ver el paso 3) con su nombre en
kebab-case (ej. `reporte-ventas-cliente.ts`) y **cambiar solo las líneas marcadas con
`// CAMBIAR`**. Los imports no se tocan: las plantillas están a la misma profundidad que las
carpetas de los módulos.

| Plantilla                         | Cuándo                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `reporte-basico.ts`               | El endpoint responde la lista y recibe `fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc` y los filtros con esos nombres. |
| `reporte-endpoint-distinto.ts`    | El endpoint trae la lista en otra propiedad, espera otros nombres de parámetros, necesita un parámetro fijo o no filtra algo (ej. fechas). Se borran las opciones `// OPCIONAL` que no hagan falta. |
| `reporte-personalizado.tsx`       | Hay que juntar varias consultas o agregar campos, o se quiere un filtro, vista, Excel o PDF propios. Para cada pieza `// OPCIONAL` que no se use: borrar su función **y** su línea `← N`; los imports que queden sin usar se quitan con `npx biome check --write --unsafe <archivo>`. |

Qué se cambia en las líneas `// CAMBIAR`:

1. **Nombre de la constante** (`reporteCambiar` → ej. `reporteVentasCliente`).
2. **`nomenclatura`**: la del `TIPO` (paso 1).
3. **Schema de la fila**: los campos del endpoint, con sus nombres exactos (ver *Referencia*).
4. **Endpoint** (`/api/appweb/CAMBIAR`).
5. **`fechas`**, **`filtros`** y **`columnas`** (ver *Referencia*).

Las plantillas compilan tal cual y no se registran (no aparecen en pantalla); la copia sí se
registra (paso 3).

Notas de las piezas de `reporte-personalizado.tsx`:

- **Consulta propia** (`consultar`): recibe los parámetros de la pantalla (`fecha_inicio`,
  `fecha_fin`, `cod_empresa`, `cod_cc` y el `id` de cada filtro; vacíos = no vienen) y devuelve
  las filas. Puede llamar varios endpoints o catálogos (todos tienen `fetchLista`), aplanar
  respuestas anidadas (una fila por lo que se quiera agrupar, ej. `crm/reporte-objetivos.tsx`) y
  agregar campos. El usuario de la sesión: `useAuthStore.getState().user?.cod_usuario`
  (`@/shared/stores/auth-store`). Un `throw new Error("mensaje")` se muestra en "Reporte".
- **Filtro propio** (`FiltroReporte`): `value` siempre es texto (`String(…)`). `useOpciones` (y
  `useValorInicial`, el valor con el que arranca) son hooks: siguen las reglas de los hooks
  (sin `if`). `useOpciones` recibe los valores de los demás filtros (ej. `valores.cod_cc`);
  `depende: ["cod_cc"]` lo limpia cuando cambia ese filtro; `requerido: true` lo hace obligatorio.
- **Vista propia** (`Contenido`): recibe `{ filas, columnas, params }`; `TablaReporte` deja la
  tabla de siempre. La vista de otro módulo se importa **por su ruta** (ej.
  `@/features/reportes-crm/components/reporte-objetivos-empleado`), no por su `index`. Datos que
  no son filas: ver `crm/reporte-graficas-objetivos.tsx`.
- **Excel propio**: `exportarExcel` (`@/shared/lib/excel`); celda con formato
  `{ dato, fontColor }`; otras opciones de la hoja: `columnaInicio`, `filaInicio`, `anchos`,
  `color`; varias hojas = varios objetos en `hojas`. `encabezado` trae los filtros de la
  consulta con nombre (Período, Empresa, Centro de costo, Asesor…).
- **PDF propio**: `descargarPdf` usa el formato de Reportes de pricing. Bloques: `titulo`,
  `texto` (`weight`, `align`, `fontSize`), `tabla`, `fila` (bloques lado a lado, `anchos` en %),
  `espacio` y `pagina` (detalle en `pricing/reportes/lib/pdf-reporte.ts`). Un diseño totalmente
  propio usa jsPDF directo (ej. el calendario de `crm/reporte-actividades.ts`).

Reportes reales para consultar en `definiciones/crm/`:

| Archivo                          | Qué personaliza                                                         |
| -------------------------------- | ----------------------------------------------------------------------- |
| `reporte-visitas-historico.ts`   | Consulta propia (2 endpoints, fechas y tipo en el front) y Excel del legacy |
| `reporte-actividades.ts`         | Consulta del usuario de la sesión, PDF propio (calendario), sin empresa/CC |
| `reporte-objetivos.tsx`          | Otros nombres de parámetros, datos anidados y vista de CRM              |
| `reporte-graficas-objetivos.tsx` | Varias consultas, datos que no son filas y vista con gráficas           |

## Referencia

### Schema de la fila

- Mira la respuesta real del endpoint (pestaña Network del navegador o el backend en
  `docs/backend/`) y copia los nombres **tal cual**.
- Texto: `z.string().nullable().catch("")`. Número: `z.coerce.number().catch(0)` (también
  convierte `"12"` y banderas `0/1`). Código: `zId` de `@/shared/lib/zod-scalars`.
- `z.looseObject` deja pasar los campos que no declares (no fallan).
- Si un campo no coincide con el schema, en desarrollo sale el error "API response failed
  schema validation" con el campo: corrige el schema.

### Fechas

| `fechas`        | Pantalla                                   | Manda                       |
| --------------- | ------------------------------------------ | --------------------------- |
| `"requeridas"`  | Fecha inicial y final con `*` (mes actual) | `fecha_inicio`, `fecha_fin` |
| `"opcionales"`  | Fechas con "x" para limpiar                | solo las que tengan valor   |
| `"ninguna"`     | Sin fechas                                 | nada                        |

Formato: `yyyy-MM-dd`.

### Filtros

Atajos de `lib/filtros.ts` (el segundo argumento es el **nombre del parámetro** que se manda):

| Atajo                                        | Qué muestra                                   |
| -------------------------------------------- | --------------------------------------------- |
| `filtroUsuario("Asesor", "cod_asesor")`      | Usuarios del CC elegido                       |
| `filtroTipo("TIPO_PAGO", "cod_tipo_pago", "Tipo de pago")` | Catálogo `TIPO` de esa `TIPO_TABLA` |
| `filtroEstado("ACTIVIDAD", "cod_estado")`    | Estados del catálogo de ese tipo              |
| `filtroLista("moneda", "Moneda", [{ value: "1", label: "GTQ" }])` | Opciones fijas           |

Modificadores (se escriben así: `{ ...filtroTipo(…), multiple: true }`):

- `multiple: true`: varios valores; llega como `"7,8"` (separado por comas).
- `requerido: true`: obligatorio; sin valor no se puede consultar.

### Columnas

| Propiedad    | Para qué                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| `id`         | Clave única (sin espacios). Se usa en `agrupacion` y en `calculada`.           |
| `label`      | Encabezado en pantalla, Excel y PDF.                                           |
| `valor`      | Qué se ve en cada fila: `(f) => f.campo`. Puede formatear o combinar campos.   |
| `agrupable`  | Aparece en "Personaliza tu reporte" (filas o columnas del resumen).            |
| `sumable`    | Se suma en el Resumen agrupado (además de la Cantidad).                        |
| `calculada`  | Medida del resumen calculada con las sumas del grupo (porcentajes).            |
| `buscable`   | El buscador de la tabla busca en ella.                                         |
| `numerica`   | Alineada a la derecha (por defecto, si es `sumable` o `calculada`).            |

**Porcentajes** (ej. % de ofertas ganadas = ganadas / ofertas): NO marcarlos `sumable` (sumar
porcentajes no tiene sentido). Las partes son `sumable` y el porcentaje `calculada`, que recibe
las sumas del grupo por `id`. `porcentaje` se importa junto con `definirReporte`:
`import { definirReporte, porcentaje } from "../../lib/definir-reporte";`

```ts
{ id: "ofertas", label: "Ofertas", valor: (f) => f.ofertas, sumable: true },
{ id: "ganadas", label: "Ganadas", valor: (f) => f.ganadas, sumable: true },
{
  id: "ganadas_pct",
  label: "Ganadas %", // con "%" en el label, el Excel le da formato de porcentaje
  valor: (f) => porcentaje(f.ganadas, f.ofertas), // lo que se ve en cada fila
  calculada: (s) => porcentaje(s.ganadas, s.ofertas), // por grupo; null si divide entre 0
},
```

### Descargas

- **Excel agrupado**: siempre (el Resumen agrupado, con el generador de Reportes de pricing).
- `descargas: { excel: true }` y/o `pdf: true`: el detalle con las columnas.
- `descargas: { excel: miFuncion, pdf: otraFuncion }`: formato propio (`reporte-personalizado.tsx`).
- Sin `descargas`: solo el Excel agrupado.

### Otras opciones de la definición

- `descripcion`: subtítulo de la sección "Reporte".
- `agrupacion: { filas: ["tipo"], columna: "estado" }`: agrupación inicial de "Personaliza tu
  reporte" (ids de columnas `agrupable`).
- `empresaCentroCosto: false`: el reporte no usa empresa ni CC (no se muestran ni se mandan).

## Paso 3 — Registro

En `definiciones/<modulo>/index.ts`, importar el reporte y sumarlo a la lista (en orden de
correlativo):

```ts
import { reporteVentasCliente } from "./reporte-ventas-cliente";

export const REPORTES_PRI: readonly Reporte[] = [reporteVentasCliente];
```

**Módulo nuevo** (sin carpeta todavía):

1. Crear `definiciones/<modulo>/index.ts` copiando `definiciones/crm/index.ts` (cambiar el
   nombre de la lista, ej. `REPORTES_PRI`).
2. En `definiciones/index.ts`: `import { REPORTES_PRI } from "./pricing";` y
   `REPORTES = [...REPORTES_CRM, ...REPORTES_PRI]`.

## Errores comunes

| Síntoma                                                     | Causa / solución                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| El reporte no aparece en el select                          | Falta el `TIPO` o la relación con el rol/CC/módulo, o el `ESTADO_ID` no es 1.      |
| "El reporte «…» (…) todavía no está configurado"            | La `NOMENCLATURA` del `TIPO` no coincide con `nomenclatura`, o falta el registro.  |
| Empresa o Centro de costo salen dos veces                   | Se agregaron en `filtros`: quitarlos.                                              |
| Error de TypeScript en `valor: (f) => f.algo`               | `algo` no está en el schema de la fila.                                            |
| "API response failed schema validation"                     | Un campo del schema no coincide con lo que manda el endpoint (nombre o tipo).      |
| Consulta vacía, pero el endpoint sí trae datos              | La lista no viene en `data`: opción `lista` (`reporte-endpoint-distinto.ts`).      |
| El endpoint ignora un filtro                                | Espera otro nombre de parámetro: opción `nombres` (`reporte-endpoint-distinto.ts`). |
| Un porcentaje sale sumado en el resumen                     | Usar `calculada`, no `sumable`.                                                    |
| Biome marca formato o imports                               | `npm run biome:arreglar`.                                                          |
| Error de JSX en el archivo del reporte                      | Con `Contenido` (o cualquier `<…>`) la extensión es `.tsx`.                        |
| La vista de otro módulo hace la pantalla muy pesada         | Importar el componente por su ruta, no por el `index` del módulo.                  |
| "Rendered more hooks…" o error de hooks en un filtro propio | `useOpciones` / `useValorInicial` no pueden tener hooks dentro de un `if`.         |
