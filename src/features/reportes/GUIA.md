# Guía: agregar un reporte

Paso a paso para agregar un reporte a la pantalla de Reportes. La arquitectura (qué hace cada
archivo) está en `ARQUITECTURA.md`; aquí solo lo que hay que hacer.

> **Qué NO hay que hacer** (lo pone la pantalla sola):
>
> - **Empresa y Centro de costo**: NO van en `filtros`. La pantalla los agrega a todos los
>   reportes según el permiso "Filtrar Empresa Centro Costo" (opción "Reportes") y siempre los
>   manda en la consulta (`cod_empresa`, `cod_cc`). Si el reporte no los usa:
>   `empresaCentroCosto: false`.
> - **Fechas**: no son un filtro; se configuran con `fechas` (ver tabla del paso 2).
> - **Botón Consultar, "Personaliza tu reporte", "Resumen agrupado" y "Excel agrupado"**: salen
>   solos para todos los reportes.

## Checklist

1. [ ] **Base de datos**: `TIPO` del reporte y su relación con rol/CC/módulo.
2. [ ] **Archivo** `definiciones/<modulo>/reporte-<nombre>.ts` (copiar la plantilla de abajo).
3. [ ] **Registro**: una línea en `definiciones/<modulo>/index.ts`.
4. [ ] `npm run check:nuevos` sin errores (si Biome se queja del formato: `npm run biome:arreglar`).
5. [ ] Probarlo: elegir el módulo y el reporte, pulsar **Consultar**.

---

## Paso 1 — Base de datos

1. Un registro en `TIPO`:
   - `TIPO_TABLA = 'REPORTE'`, `ESTADO_ID = 1`.
   - `TIPO_DESCRIPCION` = **título en pantalla** (ej. "Hit Rate").
   - `NOMENCLATURA` = **clave que une la base de datos con el código** (máximo 20 caracteres):
     `[MÓDULO EN 3 CARACTERES]-[INICIALES DEL REPORTE]-[CORRELATIVO DEL MÓDULO]`, correlativo de
     2 dígitos, sin contar "de" en las iniciales. Ej. `PRI-HR-01`, `CRM-OA-04`. Ver los usados
     en `definiciones/<modulo>/index.ts`.
2. Filas en `REPORTE_X_CC_X_MDULO_X_ROL` (`REPORTE_TIPO_ID` = el `TIPO_ID` de arriba) con
   `ROL_ID`, `EMPRESA_ID`, `CENCOS_ID` y `MODULO_ID`; `NULL` = todos.

Sin esto el reporte no aparece en el select, aunque el código esté listo.

## Paso 2 — Archivo del reporte

Va en la carpeta de su módulo: `definiciones/crm/`, `definiciones/pricing/`… (si el módulo no
tiene carpeta, ver el paso 3). Nombre en kebab-case: `reporte-hit-rate.ts`. Si usa JSX
(`Contenido` propio) la extensión es `.tsx`.

### Plantilla

```ts
import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { definirReporte, porcentaje } from "../../lib/definir-reporte";
import { filtroTipo, filtroUsuario } from "../../lib/filtros";

// (A) UNA FILA tal como la devuelve el endpoint. Solo los campos que vas a usar; nombres
//     EXACTOS del JSON (minúsculas). `.catch(…)` = valor por defecto si viene null o raro.
const filaSchema = z.looseObject({
  CAMPO_TEXTO: z.string().nullable().catch(""),
  CAMPO_NUMERO: z.coerce.number().catch(0),
});
type Fila = z.infer<typeof filaSchema>;

export const reporteNOMBRE = definirReporte<Fila>({
  nomenclatura: "MOD-XX-01", // (B) la NOMENCLATURA del TIPO, igual
  descripcion: "Subtítulo de la sección Reporte",
  fechas: "requeridas", // (C) ver tabla
  filtros: [
    // (D) opcional; SIN empresa ni CC
    filtroUsuario("Usuario", "cod_usuario"),
  ],
  consultar: consultarApi("/api/appweb/ENDPOINT", filaSchema), // (E) ver recetas
  columnas: [
    // (F) una por columna de la tabla; `f` es una fila del schema (A)
    { id: "texto", label: "Texto", valor: (f) => f.CAMPO_TEXTO, agrupable: true, buscable: true },
    { id: "numero", label: "Número", valor: (f) => f.CAMPO_NUMERO, sumable: true },
  ],
  agrupacion: { filas: ["texto"] }, // (G) opcional: agrupación inicial (ids de columnas agrupables)
  descargas: { excel: true }, // (H) opcional
});
```

### (A) Schema de la fila

- Mira la respuesta real del endpoint (pestaña Network del navegador o el backend en
  `docs/backend/`) y copia los nombres **tal cual**.
- Texto: `z.string().nullable().catch("")`. Número: `z.coerce.number().catch(0)` (también
  convierte `"12"` y banderas `0/1`). Código: `zId` de `@/shared/lib/zod-scalars`.
- `z.looseObject` deja pasar los campos que no declares (no fallan).
- Si un campo no coincide con el schema, en desarrollo sale el error "API response failed
  schema validation" con el campo: corrige el schema.

### (C) Fechas

| `fechas`        | Pantalla                                   | Manda                       |
| --------------- | ------------------------------------------ | --------------------------- |
| `"requeridas"`  | Fecha inicial y final con `*` (mes actual) | `fecha_inicio`, `fecha_fin` |
| `"opcionales"`  | Fechas con "x" para limpiar                | solo las que tengan valor   |
| `"ninguna"`     | Sin fechas                                 | nada                        |

Formato: `yyyy-MM-dd`.

### (D) Filtros

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

### (E) Recetas para `consultar` — según cómo responde el endpoint

La pantalla arma los parámetros con estos nombres (los vacíos no se mandan):
`fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc` y el id de cada filtro.

1. **Responde la lista en `data` (lo normal)**: `{ data: { success, data: [ … ] } }`, `{ data: [ … ] }`
   o `[ … ]`.

   ```ts
   consultar: consultarApi("/api/appweb/report-icc", filaSchema),
   ```

2. **La lista viene en otra propiedad**: ej. `{ data: { reporte, filas: [ … ] } }` → `lista`.
   **Necesita un parámetro fijo**: ej. `reporte=hit_rate` → `params`.

   ```ts
   consultar: consultarApi("/api/appweb/report_kpi_cotizaciones", filaSchema, {
     lista: "filas",
     params: { reporte: "hit_rate" },
   }),
   ```

3. **El endpoint espera OTROS nombres de parámetros** (ej. `cod_emp`, `fecha_inicial`) o hay que
   juntar varias respuestas: una función propia. Ejemplo completo: `consultar` de
   `crm/reporte-objetivos.tsx`.

   ```ts
   async function consultar(params: ParamsReporte): Promise<Fila[]> {
     const respuesta = await http.get<unknown>("/api/appweb/ENDPOINT", {
       params: { cod_emp: params.cod_empresa ?? "", fecha_inicial: params.fecha_inicio ?? "" },
     });
     return parseEnvelope(respuesta, filaSchema, "ENDPOINT");
   }
   ```

4. **El endpoint no filtra algo** (ej. no aplica las fechas): consultar y filtrar en la función
   propia. Ejemplo: `crm/reporte-visitas-historico.ts`.

Si el backend responde `success: false`, su mensaje se ve en la sección "Reporte".

### (F) Columnas

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

**Porcentajes** (ej. HR % = cerradas / realizadas): NO marcarlos `sumable` (sumar porcentajes no
tiene sentido). Las partes son `sumable` y el porcentaje `calculada`, que recibe las sumas del
grupo por `id`:

```ts
{ id: "realizadas", label: "Realizadas", valor: (f) => f.realizada, sumable: true },
{ id: "cerradas", label: "Cerradas", valor: (f) => f.cerrada, sumable: true },
{
  id: "hr",
  label: "HR %", // con "%" en el label, el Excel le da formato de porcentaje
  valor: (f) => (f.realizada ? f.cerrada * 100 : null), // lo que se ve en cada fila
  calculada: (s) => porcentaje(s.cerradas, s.realizadas), // por grupo; null si divide entre 0
},
```

### (H) Descargas

- **Excel agrupado**: siempre (el Resumen agrupado, con el generador de Reportes de pricing).
- `descargas: { excel: true }` y/o `pdf: true`: el detalle con las columnas.
- `descargas: { excel: miFuncion }`: formato propio; recibe `{ filas, titulo, encabezado, params }`.
  Ejemplo: `excelActividades` en `crm/reporte-visitas-historico.ts`.
- Sin `descargas`: solo el Excel agrupado.

### Otras opciones

- `empresaCentroCosto: false`: el reporte no usa empresa ni CC (no se muestran ni se mandan).
- `Contenido: MiComponente` (archivo `.tsx`): otra vista en lugar de la tabla (gráficas, la vista
  de otro módulo…). Recibe `{ filas, columnas, params }`. Ejemplo: `crm/reporte-objetivos.tsx`.

## Paso 3 — Registro

En `definiciones/<modulo>/index.ts`, importar el reporte y sumarlo a la lista (en orden de
correlativo):

```ts
import { reporteHitRate } from "./reporte-hit-rate";

export const REPORTES_PRI: readonly Reporte[] = [reporteHitRate];
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
| Error de TypeScript en `valor: (f) => f.algo`               | `algo` no está en el schema de la fila (A).                                        |
| "API response failed schema validation"                     | Un campo del schema no coincide con lo que manda el endpoint (nombre o tipo).      |
| Consulta vacía, pero el endpoint sí trae datos              | La lista no viene en `data`: usar `lista` (receta 2).                              |
| El endpoint ignora un filtro                                | Espera otro nombre de parámetro: cambiar el id del filtro o receta 3.              |
| Un porcentaje sale sumado en el resumen                     | Usar `calculada`, no `sumable`.                                                    |
| Biome marca formato o imports                               | `npm run biome:arreglar`.                                                          |
