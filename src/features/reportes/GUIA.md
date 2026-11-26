# Guía: agregar un reporte

Paso a paso para agregar un reporte a la pantalla de Reportes. La arquitectura (qué hace cada
archivo) está en `ARQUITECTURA.md`; aquí solo lo que hay que hacer. La explicación de cada parte está en
[`DOCUMENTACION.md`](DOCUMENTACION.md).

> **Qué NO hay que hacer** (lo pone la pantalla sola):
>
> - **Empresa y Centro de costo**: NO van en `filtros`. La pantalla los agrega a todos los
>   reportes según el permiso "Filtrar Empresa Centro Costo" (opción "Reportes") y siempre los
>   manda en la consulta (`cod_empresa`, `cod_cc`). Si el reporte no los usa:
>   `empresaCentroCosto: false`.
> - **Fechas**: no son un filtro; se configuran con `fechas` ([Fechas](DOCUMENTACION.md#fechas)).
> - **Botón Consultar, "Personaliza tu reporte", "Resumen agrupado" y "Excel agrupado"**: salen
>   solos para todos los reportes.

## Checklist

1. [ ] **Base de datos**: `TIPO` del reporte y su relación con rol/CC/módulo.
2. [ ] **Archivo** `definiciones/<modulo>/reporte-<nombre>.ts` (copiar una plantilla, paso 2).
3. [ ] **Registro**: una línea en `definiciones/<modulo>/index.ts`.
4. [ ] Biome sin errores: `pnpm exec biome check --write <archivo>` (en el espejo: `npm run check:nuevos`).
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

Va en la carpeta de su módulo: `definiciones/crm/`, `definiciones/pricing/`… (si el módulo no
tiene carpeta, ver el paso 3). Nombre en kebab-case: `reporte-ventas-cliente.ts`. Si usa JSX
(`Contenido` propio) la extensión es `.tsx`.

### Plantillas

Copiar una plantilla de `src/features/reportes/definiciones/plantillas/` y cambiar las líneas
marcadas `// CAMBIAR`:

| Plantilla                         | Cuándo                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`reporte-basico.ts`](definiciones/plantillas/reporte-basico.ts)               | El endpoint responde la lista y recibe `fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc` y los filtros con esos nombres. |
| [`reporte-endpoint-distinto.ts`](definiciones/plantillas/reporte-endpoint-distinto.ts)    | El endpoint trae la lista en otra propiedad, espera otros nombres de parámetros, necesita un parámetro fijo o no filtra algo (ej. fechas). Se borran las opciones `// OPCIONAL` que no hagan falta. |
| [`reporte-personalizado.tsx`](definiciones/plantillas/reporte-personalizado.tsx)       | Hay que juntar varias consultas o agregar campos, o se quiere un filtro, vista, Excel o PDF propios. Para cada pieza `// OPCIONAL` que no se use: borrar su función **y** su línea `← N`; los imports que queden sin usar se quitan con `pnpm exec biome check --write --unsafe <archivo>`. |

La plantilla, con cada parte marcada:

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
  fechas: "requeridas", // (C) ver Fechas
  filtros: [
    // (D) opcional; SIN empresa ni CC
    filtroUsuario("Usuario", "cod_usuario"),
  ],
  consultar: consultarApi("/api/appweb/ENDPOINT", filaSchema), // (E) ver Consulta
  columnas: [
    // (F) una por columna de la tabla; `f` es una fila del schema (A)
    { id: "texto", label: "Texto", valor: (f) => f.CAMPO_TEXTO, agrupable: true, buscable: true },
    { id: "numero", label: "Número", valor: (f) => f.CAMPO_NUMERO, sumable: true },
  ],
  agrupacion: { filas: ["texto"] }, // (G) opcional: agrupación inicial (ids de columnas agrupables)
  descargas: { excel: true }, // (H) opcional
  // Contenido: MiVista, // (I) opcional: gráficas u otra vista en lugar de la tabla (archivo .tsx)
});
```

Qué va en cada marca, con su explicación:

| Marca | Qué es | Explicación |
| ----- | ------ | ----------- |
| (A) | Schema de la fila (campos del endpoint) | [Schema de la fila](DOCUMENTACION.md#schema-de-la-fila) · [De dónde sale cada dato](DOCUMENTACION.md#de-dónde-sale-cada-dato) |
| (B) | `nomenclatura` | Paso 1 |
| (C) | `fechas` | [Fechas](DOCUMENTACION.md#fechas) |
| (D) | `filtros` | [Filtros](DOCUMENTACION.md#filtros) |
| (E) | `consultar` | [Consulta](DOCUMENTACION.md#consulta) |
| (F) | `columnas` | [Columnas](DOCUMENTACION.md#columnas) |
| (G) | `agrupacion` | [Columnas](DOCUMENTACION.md#columnas) (ids de columnas `agrupable`) |
| (H) | `descargas` | [Descargas](DOCUMENTACION.md#descargas) |
| (I) | `Contenido` | [Vista propia](DOCUMENTACION.md#vista-propia-contenido) |

Si algo no lo cubre la plantilla básica (otra consulta, un filtro, vista, Excel o PDF propios):
[`reporte-personalizado.tsx`](definiciones/plantillas/reporte-personalizado.tsx) y la sección de esa
pieza en la documentación. Ejemplos completos: [Ejemplos](DOCUMENTACION.md#ejemplos). Si algo
falla: [Errores comunes](DOCUMENTACION.md#errores-comunes).

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
