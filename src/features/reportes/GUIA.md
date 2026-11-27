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
> - **Fechas**: no son un filtro; se configuran con `fechas` ([Fechas](DOCUMENTACION.md#fechas-c)).
> - **Botón Consultar, "Personaliza tu reporte", "Resumen agrupado" y "Excel agrupado"**: salen
>   solos para todos los reportes. Un reporte sin vista agrupada (solo la tabla y sus descargas)
>   lleva `agrupado: false`: no salen "Personaliza tu reporte", el Resumen ni el "Excel agrupado".

## Checklist

1. [ ] **Base de datos**: `TIPO` del reporte y su relación con rol/CC/módulo.
2. [ ] **Carpetas del módulo** (opcional, paso 2): `definiciones/<modulo>/` y `contenido/<modulo>/`.
3. [ ] **Archivo** `definiciones/<modulo>/reporte-<nombre>.ts` (copiar una plantilla, paso 3).
4. [ ] **Registro**: una línea en `definiciones/<modulo>/index.ts` (paso 4).
5. [ ] Biome sin errores: `pnpm exec biome check --write <archivo>`.
6. [ ] Probarlo: elegir el módulo y el reporte, pulsar **Consultar**.

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

## Paso 2 — Carpetas del módulo (opcional)

Solo si el módulo todavía no las tiene:

- `definiciones/<modulo>/`: los archivos de los reportes (paso 3).
- `contenido/<modulo>/`: los componentes de las vistas propias (`Contenido`) de sus reportes
  (ej. `contenido/pricing/hit-rate.tsx`).

## Paso 3 — Archivo del reporte

Va en la carpeta de su módulo, `definiciones/<modulo>/`: `definiciones/crm/`, `definiciones/pricing/`… Nombre en kebab-case: `reporte-ventas-cliente.ts`. Si usa JSX
(`Contenido` propio) la extensión es `.tsx`.

### Plantillas

Copiar una plantilla de `src/features/reportes/definiciones/plantillas/` y llenar las líneas
que llevan el comentario `// CAMBIAR`. Cuál plantilla usar:

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
| (A) | Schema de la fila (campos del endpoint) | [Schema de la fila](DOCUMENTACION.md#schema-de-la-fila-a) · [De dónde sale cada dato](DOCUMENTACION.md#de-dónde-sale-cada-dato) |
| (B) | `nomenclatura` | Paso 1 · [Nomenclatura](DOCUMENTACION.md#nomenclatura-b) |
| (C) | `fechas` | [Fechas](DOCUMENTACION.md#fechas-c) |
| (D) | `filtros` | [Filtros](DOCUMENTACION.md#filtros-d) |
| (E) | `consultar` | [Consulta](DOCUMENTACION.md#consulta-e) |
| (F) | `columnas` | [Columnas](DOCUMENTACION.md#columnas-f) |
| (G) | `agrupacion` | [Agrupación inicial](DOCUMENTACION.md#agrupación-inicial-g) |
| (H) | `descargas` | [Descargas](DOCUMENTACION.md#descargas-h) |
| (I) | `Contenido` | [Vista propia](DOCUMENTACION.md#vista-propia-contenido-i) |

Si algo no lo cubre la plantilla básica (otra consulta, un filtro, vista, Excel o PDF propios):
[`reporte-personalizado.tsx`](definiciones/plantillas/reporte-personalizado.tsx) y la sección de esa
pieza en la documentación. Ejemplos completos: [Ejemplos](DOCUMENTACION.md#ejemplos). Si algo
falla: [Errores comunes](DOCUMENTACION.md#errores-comunes).

### Cómo llenar cada marca

En orden, (A) a (I). Cada marca muestra cómo queda en el
[ejemplo con todas las piezas](#ejemplo-con-todas-las-piezas) (un reporte de avance de
actividades por asesor).

**(A) Schema de la fila.** Describe una fila tal como la manda el endpoint; lo que no esté aquí
no se puede usar en las columnas (F).

- **De dónde sale:** abrir la pantalla que ya usa el endpoint → pestaña **Network** → la
  petición → **Response**. Copiar solo los campos que se van a usar, con el nombre exacto del
  JSON (en minúsculas).
- **Tipo de cada campo:** texto `z.string().nullable().catch("")`; número
  `z.coerce.number().catch(0)` (también convierte `"12"` y banderas `0/1`). `.catch(…)` es el
  valor que se usa si viene `null` o algo raro.
- **Campos que no manda el endpoint:** se agregan al `type Fila` y los llena la consulta (E).
- **Si un campo no coincide:** en desarrollo sale "API response failed schema validation" con el
  nombre del campo.

En el ejemplo, `asesor` y `finalizada` van en `type Fila` porque el endpoint no los manda:
`asesor` sale de otra consulta y `finalizada` se calcula.

```ts
const filaSchema = z.looseObject({
  cod_actividad: z.coerce.number(),
  cod_tipo: z.coerce.number().catch(0),
  nom_tipo: z.string().nullable().catch(""),
  nombre_cliente: z.string().nullable().catch(""),
  estado_desc: z.string().nullable().catch(""),
  cod_asesor: z.coerce.number().catch(0),
  fecha_programada: z.string().nullable().catch(""),
});
type Fila = z.infer<typeof filaSchema> & { asesor: string; finalizada: number };
```

**(B) Nomenclatura.** La clave que une el código con la base de datos: **igual** a la
`NOMENCLATURA` del `TIPO` del paso 1. Si no coincide, el reporte aparece en el select pero dice
que todavía no está configurado.

En el ejemplo, "**A**vance de **A**ctividades **P**or **A**sesor", correlativo 93:

```ts
nomenclatura: "CRM-AAPA-93", // (B)
```

**(C) Fechas.** Si la pantalla pide período:

- `"requeridas"`: fecha inicial y final obligatorias; arranca en el mes actual. Manda
  `fecha_inicio` y `fecha_fin` (`yyyy-MM-dd`).
- `"opcionales"`: fechas con "x" para limpiar; solo manda las que tengan valor.
- `"ninguna"`: sin fechas.

Si no se pone, queda `"requeridas"`. Si el endpoint no filtra por fecha, se filtra en la consulta
(E) con `fechaEnRango`.

En el ejemplo es `"requeridas"`, pero `lista-actividades2` no filtra por fecha: lo hace la
consulta (E).

```ts
fechas: "requeridas", // (C)
```

**(D) Filtros.** Los selects que salen además de empresa, CC y fechas (esos los pone la pantalla
siempre):

- **Atajos** de `lib/filtros.ts`: `filtroUsuario`, `filtroCliente`, `filtroTipo`, `filtroEstado`,
  `filtroLista`. El segundo argumento es el `id`.
- **Filtro propio** (cuando no hay atajo para esa lista): un objeto `FiltroReporte` en el mismo
  archivo.
- **`id`:** el nombre del parámetro que llega a la consulta (E) y se manda al endpoint (ej.
  `cod_usuario`).
- **Modificadores:** `multiple: true` (llega como `"7,8"`) y `requerido: true`.

Si no se pone, solo salen empresa, CC y fechas.

En el ejemplo, Asesor usa el atajo `filtroUsuario`. Tipo de actividad es propio porque no hay
atajo para los tipos de actividad; es `multiple`, por eso la consulta lo separa por comas.

```ts
filtros: [filtroUsuario("Asesor", "cod_usuario"), filtroTipoActividad], // (D)
```

```tsx
const filtroTipoActividad: FiltroReporte = {
  id: "cod_tipo",
  label: "Tipo de actividad",
  multiple: true,
  useOpciones: () => {
    const { data, isLoading } = tipos.useLista({ tipo_tabla: "ACTIVIDAD" });
    const opciones = React.useMemo<ComboboxOption[]>(
      () => (data ?? []).map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
      [data],
    );
    return { opciones, cargando: isLoading };
  },
};
```

**(E) Consulta.** Trae las filas. Recibe los parámetros de la pantalla (`fecha_inicio`,
`fecha_fin`, `cod_empresa`, `cod_cc` y el `id` de cada filtro; los vacíos no vienen):

- `consultarApi(endpoint, filaSchema)`: el endpoint responde la lista y recibe esos nombres.
- `consultarApi(…, { lista, params, nombres, filtrar })`: la lista viene en otra propiedad, falta
  un parámetro fijo, el endpoint espera otros nombres o no filtra algo.
- Una función propia `async (params) => Fila[]`: para juntar varias consultas o agregar campos.

En una función propia, cada endpoint se lee con `parseEnvelope(respuesta, filaSchema, "<endpoint>")`:
`respuesta` es lo que devuelve `http.get`, `filaSchema` revisa cada fila y el tercero es el nombre del
endpoint (la última parte de la URL, ej. `"lista-actividades2"`). Ese nombre solo sirve para saber
qué consulta falló: sale en el error si las filas no cumplen `filaSchema`.

En el ejemplo es propia porque junta dos consultas (actividades y empleados), filtra lo que el
endpoint no filtra (fechas, asesor y tipo) y agrega `asesor` y `finalizada` a cada fila.

```ts
async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const [actividades, empleados] = await Promise.all([
    http
      .get<unknown>("/api/appweb/lista-actividades2", {
        params: { cod_empresa: params.cod_empresa ?? "", cod_cc: params.cod_cc ?? "" },
      })
      .then((respuesta) => parseEnvelope(respuesta, filaSchema, "lista-actividades2")),
    empleadosUsuarios.fetchLista({}),
  ]);
  const nombres = new Map(empleados.map((e) => [String(e.codUsuario), e.nombreCompleto]));
  const tiposElegidos = params.cod_tipo ? params.cod_tipo.split(",") : [];
  return actividades
    .filter((a) => fechaEnRango(a.fecha_programada, params))
    .filter((a) => !params.cod_usuario || String(a.cod_asesor) === params.cod_usuario)
    .filter((a) => tiposElegidos.length === 0 || tiposElegidos.includes(String(a.cod_tipo)))
    .map((a) => ({
      ...a,
      asesor: nombres.get(String(a.cod_asesor)) ?? "",
      finalizada: a.estado_desc === "FINALIZADO" ? 1 : 0,
    }));
}
```

```ts
consultar, // (E)
```

**(F) Columnas.** Una por cada dato que se ve en la tabla, el Excel y el PDF:

- `id`: clave única; se usa en (G) y en `calculada`.
- `label`: el encabezado.
- `valor`: qué se muestra, `(f) => f.campo`.
- Opcionales: `agrupable` (sale en "Personaliza tu reporte"), `buscable` (el buscador busca en
  ella), `sumable` (se suma en el Resumen agrupado) y `calculada` (en el resumen se calcula con
  las sumas del grupo; para porcentajes, que no se suman).

En el ejemplo, `finalizada` es `sumable` para contar las finalizadas de cada grupo, y `avance`
es `calculada` (finalizadas ÷ cantidad) porque sumar porcentajes da un número sin sentido.

```ts
columnas: [
  { id: "codigo", label: "Código", valor: (f) => f.cod_actividad },
  { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
  { id: "asesor", label: "Asesor", valor: (f) => f.asesor, agrupable: true, buscable: true },
  { id: "cliente", label: "Cliente", valor: (f) => f.nombre_cliente, buscable: true },
  { id: "estado", label: "Estado", valor: (f) => f.estado_desc, agrupable: true },
  { id: "finalizada", label: "Finalizadas", valor: (f) => f.finalizada, sumable: true },
  {
    id: "avance",
    label: "Avance %",
    valor: (f) => f.finalizada * 100,
    calculada: (sumas) => porcentaje(sumas.finalizada, sumas.cantidad),
  },
],
```

**(G) Agrupación inicial.** Cómo sale agrupado el Resumen al abrir: `filas` (ids de columnas
para las filas) y `columna` (un id para las columnas). Solo ids de columnas `agrupable`; si un id
no lo es, se ignora. Si no se pone, el usuario elige la agrupación en "Personaliza tu reporte".

En el ejemplo, por asesor en filas y por tipo en columnas, para ver cuántas actividades de cada
tipo tiene cada asesor.

```ts
agrupacion: { filas: ["asesor"], columna: "tipo" }, // (G)
```

**(H) Descargas.** Opcional. El botón "Excel agrupado" (el Resumen agrupado) sale siempre;
`descargas` agrega los botones **Excel** y/o **PDF**, que descargan el detalle (las filas).
`excel` y `pdf` aceptan cada uno:

- `true`: descarga las filas con las columnas de (F), sin formato extra.
- una función `async ({ filas, titulo, encabezado, params }) => void`: arma el archivo a tu
  manera (colores, otras columnas, varias hojas). Ver
  [Excel propio](DOCUMENTACION.md#excel-propio) y [PDF propio](DOCUMENTACION.md#pdf-propio).
  Para rellenar celdas con un color (ej. las vacías en amarillo, `EMB-EFCLTGT-01`):
  `descargarExcelReporte({ titulo, encabezado, detalle: tablaDetalle(filas, columnas),
  colorFondoCelda })` (`lib/exportar.ts`, el mismo Excel de `excel: true`).
- solo en `pdf`, `"contenido"`: al pulsar PDF, la vista (I) genera el PDF. Sirve cuando el PDF
  tiene que llevar algo que solo existe en la vista, como una gráfica.

Si no se pone `descargas`, solo sale "Excel agrupado".

En el ejemplo, `excel` es una función (`excelAvance`) porque pinta de rojo el estado de las
actividades no finalizadas, y `pdf` es `"contenido"` porque el PDF lleva la gráfica de (I).

```ts
descargas: { excel: excelAvance, pdf: "contenido" }, // (H)
```

```ts
async function excelAvance({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(titulo)}.xlsx`,
    titulo,
    encabezado,
    hojas: [
      {
        nombre: titulo.slice(0, 31),
        mostrarCuadricula: true,
        autoFiltro: true,
        columnas: ["Código", "Tipo", "Asesor", "Cliente", "Estado"],
        filas: filas.map((f): CeldaExcel[] => [
          f.cod_actividad,
          f.nom_tipo,
          f.asesor,
          f.nombre_cliente,
          f.finalizada ? f.estado_desc : { dato: f.estado_desc, fontColor: "FFB30000" },
        ]),
      },
    ],
  });
}
```

**(I) Contenido.** Un componente que reemplaza la tabla de la sección "Reporte". Recibe
`filas`, `columnas`, `params` (los de la última consulta) y, si (H) tiene `pdf: "contenido"`, las
props del PDF. Para dejar también la tabla de siempre: `TablaReporte`. Con JSX el archivo es
`.tsx`. Si no se pone, se ve la tabla con las columnas (F).

En el ejemplo dibuja una gráfica por asesor con la tabla debajo, y cuando se pulsa PDF
(`solicitudPdf` cambia) genera el PDF con esa gráfica.

**Cómo funciona el PDF de la vista** (con `pdf: "contenido"` en (H)):

1. Cada clic en el botón PDF de la pantalla sube `solicitudPdf` (1, 2, 3…).
2. La vista guarda el último valor en un `useRef` y genera el PDF en un `useEffect` solo cuando
   `solicitudPdf` cambia. Así no se genera al abrir la vista.
3. `onGenerandoPdf(true)` y luego `onGenerandoPdf(false)`: el botón muestra "Generando PDF...".
   `onErrorPdf(mensaje)`: el error sale junto al botón (`onErrorPdf(null)` lo limpia). Si el PDF
   se arma con `usePdfReporte` (el PDF de Reportes de pricing, con gráficas y leyendas), se le
   pasan al crearlo y el hook los llama solo:
   `usePdfReporte({ onGenerando: onGenerandoPdf, onError: onErrorPdf })`, y se usa su `generar`.
4. `header: encabezado`: el encabezado del PDF (Período, Empresa, Centro de costo y cada filtro
   con su nombre) ya viene armado. No hace falta leer las fechas de `params`.

**Totales en la vista.** La vista recibe en `filas` lo que devuelve `consultar`. Si `consultar`
ya agrupa (ej. una fila por persona), el total no llega aparte: se saca en la vista sumando
`filas` con `useMemo` y se usa en la pantalla y en el PDF. Caso real: el ICC
(`contenido/crm/icc.tsx`, con `totalIcc` de `lib/crm/reporte-icc.ts`). Para pasar `filas` a una
tabla, no copiarlas (`[...filas]`): cada render sería un arreglo nuevo y la tabla volvería a la
página 1.

```tsx
function VistaAvance(props: ContenidoReporteProps<Fila>) {
  const { filas, encabezado, solicitudPdf, onGenerandoPdf, onErrorPdf } = props;
  const grafica = React.useRef<HTMLDivElement>(null);

  const porAsesor = React.useMemo(() => {
    const grupos = new Map<string, { asesor: string; total: number; finalizadas: number }>();
    for (const f of filas) {
      const grupo = grupos.get(f.asesor) ?? { asesor: f.asesor, total: 0, finalizadas: 0 };
      grupo.total += 1;
      grupo.finalizadas += f.finalizada;
      grupos.set(f.asesor, grupo);
    }
    return [...grupos.values()];
  }, [filas]);

  const ultimaSolicitud = React.useRef(solicitudPdf);
  React.useEffect(() => {
    if (solicitudPdf === ultimaSolicitud.current) return;
    ultimaSolicitud.current = solicitudPdf;
    onGenerandoPdf(true);
    onErrorPdf(null);
    descargarPdf({
      titulo: "Avance de actividades por asesor",
      header: encabezado, // Período, Empresa, Centro de costo y cada filtro, ya armados
      horizontal: true,
      contenido: [
        { tipo: "grafica", elemento: grafica.current },
        {
          tipo: "tabla",
          columnas: ["Asesor", "Actividades", "Finalizadas"],
          filas: porAsesor.map((g) => [g.asesor, g.total, g.finalizadas]),
        },
      ],
    })
      .catch((error) =>
        onErrorPdf(error instanceof Error ? error.message : "No se pudo generar el PDF."),
      )
      .finally(() => onGenerandoPdf(false));
  }, [solicitudPdf, porAsesor, encabezado, onGenerandoPdf, onErrorPdf]);

  return (
    <div className="space-y-4">
      <div ref={grafica} className="rounded-lg border p-3">
        <BarChart width={720} height={300} data={porAsesor}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="asesor" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" name="Actividades" fill="#94a3b8" />
          <Bar dataKey="finalizadas" name="Finalizadas" fill="#16a34a" />
        </BarChart>
      </div>
      <TablaReporte {...props} />
    </div>
  );
}
```

```ts
Contenido: VistaAvance, // (I)
```

## Paso 4 — Registro

**Si `definiciones/<modulo>/index.ts` no existe:**

1. Crear `definiciones/<modulo>/index.ts` copiando `definiciones/crm/index.ts` (cambiar el
   nombre de la lista, ej. `REPORTES_PRI`).
2. En `definiciones/index.ts`: `import { REPORTES_PRI } from "./pricing";` y
   `REPORTES = [...REPORTES_CRM, ...REPORTES_PRI]`.

En `definiciones/<modulo>/index.ts`, importar el reporte y sumarlo a la lista (en orden de
correlativo):

```ts
import { reporteVentasCliente } from "./reporte-ventas-cliente";

export const REPORTES_PRI: readonly Reporte[] = [reporteVentasCliente];
```

## Ejemplo con todas las piezas

El reporte de [Cómo llenar cada marca](#cómo-llenar-cada-marca), completo: compila y funciona tal
cual (probado con `lista-actividades2`). Usa todas las marcas (A) a (I) a la vez.

```tsx
import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { empleadosUsuarios, tipos } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import { type CeldaExcel, exportarExcel } from "@/shared/lib/excel";
import { TablaReporte } from "../../components/contenido-reporte";
import {
  type ContenidoReporteProps,
  type DescargaReporte,
  definirReporte,
  type FiltroReporte,
  fechaEnRango,
  type ParamsReporte,
  porcentaje,
} from "../../lib/definir-reporte";
import { descargarPdf, nombreArchivo } from "../../lib/exportar";
import { filtroUsuario } from "../../lib/filtros";

// (A) Schema de la fila
const filaSchema = z.looseObject({
  cod_actividad: z.coerce.number(),
  cod_tipo: z.coerce.number().catch(0),
  nom_tipo: z.string().nullable().catch(""),
  nombre_cliente: z.string().nullable().catch(""),
  estado_desc: z.string().nullable().catch(""),
  cod_asesor: z.coerce.number().catch(0),
  fecha_programada: z.string().nullable().catch(""),
});
type Fila = z.infer<typeof filaSchema> & { asesor: string; finalizada: number };

// (D) Filtro propio
const filtroTipoActividad: FiltroReporte = {
  id: "cod_tipo",
  label: "Tipo de actividad",
  multiple: true,
  useOpciones: () => {
    const { data, isLoading } = tipos.useLista({ tipo_tabla: "ACTIVIDAD" });
    const opciones = React.useMemo<ComboboxOption[]>(
      () => (data ?? []).map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
      [data],
    );
    return { opciones, cargando: isLoading };
  },
};

// (E) Consulta propia
async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const [actividades, empleados] = await Promise.all([
    http
      .get<unknown>("/api/appweb/lista-actividades2", {
        params: { cod_empresa: params.cod_empresa ?? "", cod_cc: params.cod_cc ?? "" },
      })
      .then((respuesta) => parseEnvelope(respuesta, filaSchema, "lista-actividades2")),
    empleadosUsuarios.fetchLista({}),
  ]);
  const nombres = new Map(empleados.map((e) => [String(e.codUsuario), e.nombreCompleto]));
  const tiposElegidos = params.cod_tipo ? params.cod_tipo.split(",") : [];
  return actividades
    .filter((a) => fechaEnRango(a.fecha_programada, params))
    .filter((a) => !params.cod_usuario || String(a.cod_asesor) === params.cod_usuario)
    .filter((a) => tiposElegidos.length === 0 || tiposElegidos.includes(String(a.cod_tipo)))
    .map((a) => ({
      ...a,
      asesor: nombres.get(String(a.cod_asesor)) ?? "",
      finalizada: a.estado_desc === "FINALIZADO" ? 1 : 0,
    }));
}

// (H) Excel propio
async function excelAvance({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(titulo)}.xlsx`,
    titulo,
    encabezado,
    hojas: [
      {
        nombre: titulo.slice(0, 31),
        mostrarCuadricula: true,
        autoFiltro: true,
        columnas: ["Código", "Tipo", "Asesor", "Cliente", "Estado"],
        filas: filas.map((f): CeldaExcel[] => [
          f.cod_actividad,
          f.nom_tipo,
          f.asesor,
          f.nombre_cliente,
          f.finalizada ? f.estado_desc : { dato: f.estado_desc, fontColor: "FFB30000" },
        ]),
      },
    ],
  });
}

// (I) Vista propia (+ el PDF de (H))
function VistaAvance(props: ContenidoReporteProps<Fila>) {
  const { filas, encabezado, solicitudPdf, onGenerandoPdf, onErrorPdf } = props;
  const grafica = React.useRef<HTMLDivElement>(null);

  const porAsesor = React.useMemo(() => {
    const grupos = new Map<string, { asesor: string; total: number; finalizadas: number }>();
    for (const f of filas) {
      const grupo = grupos.get(f.asesor) ?? { asesor: f.asesor, total: 0, finalizadas: 0 };
      grupo.total += 1;
      grupo.finalizadas += f.finalizada;
      grupos.set(f.asesor, grupo);
    }
    return [...grupos.values()];
  }, [filas]);

  const ultimaSolicitud = React.useRef(solicitudPdf);
  React.useEffect(() => {
    if (solicitudPdf === ultimaSolicitud.current) return;
    ultimaSolicitud.current = solicitudPdf;
    onGenerandoPdf(true);
    onErrorPdf(null);
    descargarPdf({
      titulo: "Avance de actividades por asesor",
      header: encabezado, // Período, Empresa, Centro de costo y cada filtro, ya armados
      horizontal: true,
      contenido: [
        { tipo: "grafica", elemento: grafica.current },
        {
          tipo: "tabla",
          columnas: ["Asesor", "Actividades", "Finalizadas"],
          filas: porAsesor.map((g) => [g.asesor, g.total, g.finalizadas]),
        },
      ],
    })
      .catch((error) =>
        onErrorPdf(error instanceof Error ? error.message : "No se pudo generar el PDF."),
      )
      .finally(() => onGenerandoPdf(false));
  }, [solicitudPdf, porAsesor, encabezado, onGenerandoPdf, onErrorPdf]);

  return (
    <div className="space-y-4">
      <div ref={grafica} className="rounded-lg border p-3">
        <BarChart width={720} height={300} data={porAsesor}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="asesor" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" name="Actividades" fill="#94a3b8" />
          <Bar dataKey="finalizadas" name="Finalizadas" fill="#16a34a" />
        </BarChart>
      </div>
      <TablaReporte {...props} />
    </div>
  );
}

export const reporteAvanceActividades = definirReporte<Fila>({
  nomenclatura: "CRM-AAPA-93", // (B)
  descripcion: "Actividades finalizadas de cada asesor en el período",
  fechas: "requeridas", // (C)
  filtros: [filtroUsuario("Asesor", "cod_usuario"), filtroTipoActividad], // (D)
  consultar, // (E)
  columnas: [
    // (F)
    { id: "codigo", label: "Código", valor: (f) => f.cod_actividad },
    { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
    { id: "asesor", label: "Asesor", valor: (f) => f.asesor, agrupable: true, buscable: true },
    { id: "cliente", label: "Cliente", valor: (f) => f.nombre_cliente, buscable: true },
    { id: "estado", label: "Estado", valor: (f) => f.estado_desc, agrupable: true },
    { id: "finalizada", label: "Finalizadas", valor: (f) => f.finalizada, sumable: true },
    {
      id: "avance",
      label: "Avance %",
      valor: (f) => f.finalizada * 100,
      calculada: (sumas) => porcentaje(sumas.finalizada, sumas.cantidad),
    },
  ],
  agrupacion: { filas: ["asesor"], columna: "tipo" }, // (G)
  descargas: { excel: excelAvance, pdf: "contenido" }, // (H)
  Contenido: VistaAvance, // (I)
});
```

## Ejemplos completos

Las plantillas ya llenadas: reportes completos que compilan y funcionan tal cual (probados con
`lista-actividades2`), para ver cómo queda cada caso. Equivalen a `reporte-basico.ts` (Ejemplo A),
`reporte-endpoint-distinto.ts` (Ejemplo B) y `reporte-personalizado.tsx` (Ejemplo C).

### Ejemplo A — básico

**Cuándo es tu caso:** el endpoint responde la lista y recibe los parámetros con los nombres de
la pantalla. **En qué fijarte:** no hay ninguna función propia; solo schema, filtros, columnas,
agrupación y descargas.

```ts
import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { definirReporte } from "../../lib/definir-reporte";
import { filtroEstado } from "../../lib/filtros";

/**
 * EJEMPLO A — BÁSICO: el endpoint responde la lista y recibe los parámetros con los nombres de
 * la pantalla. No hay funciones propias.
 */

// 1. Cómo viene UNA fila del endpoint (nombres exactos del JSON; solo los que se usan).
const filaSchema = z.looseObject({
  cod_actividad: z.coerce.number(),
  nom_tipo: z.string().nullable().catch(""),
  nombre_cliente: z.string().nullable().catch(""),
  estado_desc: z.string().nullable().catch(""),
});
type Fila = z.infer<typeof filaSchema>;

// 2. La definición.
export const reporteEjemploA = definirReporte<Fila>({
  nomenclatura: "CRM-EA-90",
  descripcion: "Actividades de la empresa y el centro de costo",
  fechas: "ninguna",
  filtros: [filtroEstado("ACTIVIDAD", "cod_estado")],
  consultar: consultarApi("/api/appweb/lista-actividades2", filaSchema),
  columnas: [
    { id: "codigo", label: "Código", valor: (f) => f.cod_actividad },
    { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
    {
      id: "cliente",
      label: "Cliente",
      valor: (f) => f.nombre_cliente,
      agrupable: true,
      buscable: true,
    },
    { id: "estado", label: "Estado", valor: (f) => f.estado_desc, agrupable: true },
  ],
  agrupacion: { filas: ["tipo"] },
  descargas: { excel: true },
});
```

### Ejemplo B — endpoint distinto (sin funciones propias)

**Cuándo es tu caso:** el endpoint espera otros nombres de parámetros, trae la lista en otra
propiedad o no filtra algo (aquí, la fecha). **En qué fijarte:** las opciones de `consultarApi`
(`nombres: { cod_usuario: "cod_asesor" }` y `filtrar`).

Todo se resuelve con las opciones de `consultarApi`:

| Opción     | Para qué                                                          | Ejemplo                                       |
| ---------- | ----------------------------------------------------------------- | --------------------------------------------- |
| `lista`    | La lista no viene en `data` (ej. `{ data: { tipo, detalle: [ … ] } }`) | `lista: "detalle"`                     |
| `params`   | Parámetro fijo que siempre se manda                               | `params: { tipo: "mensual" }`                 |
| `nombres`  | El endpoint espera otro nombre (nombre de la pantalla → del endpoint) | `nombres: { cod_empresa: "cod_emp", fecha_inicio: "fecha_inicial" }` |
| `filtrar`  | Lo que el endpoint no filtra (`true` = la fila se queda)          | `filtrar: (f, params) => fechaEnRango(f.fecha, params)` |

```ts
import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { definirReporte, fechaEnRango } from "../../lib/definir-reporte";
import { filtroUsuario } from "../../lib/filtros";

/**
 * EJEMPLO B — ENDPOINT DISTINTO: se resuelve con las opciones de `consultarApi`, sin funciones
 * propias. Aquí el endpoint espera el asesor como `cod_asesor` y no filtra por fecha.
 */

const filaSchema = z.looseObject({
  cod_actividad: z.coerce.number(),
  nom_tipo: z.string().nullable().catch(""),
  nombre_cliente: z.string().nullable().catch(""),
  fecha_programada: z.string().nullable().catch(""),
});
type Fila = z.infer<typeof filaSchema>;

export const reporteEjemploB = definirReporte<Fila>({
  nomenclatura: "CRM-EB-91",
  fechas: "requeridas",
  filtros: [filtroUsuario("Asesor", "cod_usuario")],
  consultar: consultarApi("/api/appweb/lista-actividades2", filaSchema, {
    // El filtro se llama cod_usuario, pero el endpoint lo espera como cod_asesor.
    nombres: { cod_usuario: "cod_asesor" },
    // El endpoint no filtra por fecha: se filtra aquí con el período de la pantalla.
    filtrar: (f, params) => fechaEnRango(f.fecha_programada, params),
    // Otras opciones (si hicieran falta):
    // lista: "detalle",            → la lista viene en data.detalle
    // params: { tipo: "mensual" }, → parámetro fijo que siempre se manda
  }),
  columnas: [
    { id: "codigo", label: "Código", valor: (f) => f.cod_actividad },
    { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
    { id: "cliente", label: "Cliente", valor: (f) => f.nombre_cliente, agrupable: true },
    { id: "fecha", label: "Fecha programada", valor: (f) => f.fecha_programada },
  ],
});
```

### Ejemplo C — personalizado (funciones propias)

**Cuándo es tu caso:** hay que juntar consultas o agregar campos, o se quiere un filtro, vista,
Excel o PDF propios. **En qué fijarte:** cada función de arriba y su línea `← N` en la definición.

Cada pieza propia es una función **de este mismo archivo** (arriba) y se conecta en su
propiedad de la definición (abajo, marcadas con `← 1` … `← 5`). Se dejan solo las que hagan
falta: si no se necesita un PDF propio, se borra la función `pdfEjemplo` y `pdf: pdfEjemplo`.

```tsx
import React from "react";
import { z } from "zod";
import { empleadosUsuarios, tipos } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import { type CeldaExcel, exportarExcel } from "@/shared/lib/excel";
import { TablaReporte } from "../../components/contenido-reporte";
import {
  type ContenidoReporteProps,
  type DescargaReporte,
  definirReporte,
  type FiltroReporte,
  type ParamsReporte,
} from "../../lib/definir-reporte";
import { descargarPdf, nombreArchivo } from "../../lib/exportar";
import { filtroUsuario } from "../../lib/filtros";

/**
 * EJEMPLO C — PERSONALIZADO: cada pieza propia es una función de ESTE archivo (arriba) y se
 * conecta en su propiedad de la definición (abajo). Lo que no se conecta usa lo de siempre.
 */

const filaSchema = z.looseObject({
  cod_actividad: z.coerce.number(),
  cod_tipo: z.coerce.number().catch(0),
  nom_tipo: z.string().nullable().catch(""),
  estado_desc: z.string().nullable().catch(""),
  cod_asesor: z.coerce.number().catch(0),
});
// La fila puede llevar campos que no vienen del endpoint (aquí `asesor`).
type Fila = z.infer<typeof filaSchema> & { asesor: string };

// ── 1. Consulta propia → se conecta en `consultar` ──
// Junta dos consultas y agrega el nombre del asesor a cada fila.
async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const [actividades, empleados] = await Promise.all([
    http
      .get<unknown>("/api/appweb/lista-actividades2", {
        params: { cod_empresa: params.cod_empresa ?? "", cod_cc: params.cod_cc ?? "" },
      })
      .then((respuesta) => parseEnvelope(respuesta, filaSchema, "lista-actividades2")),
    empleadosUsuarios.fetchLista({}),
  ]);
  const nombres = new Map(empleados.map((e) => [String(e.codUsuario), e.nombreCompleto]));
  return actividades
    .filter((a) => !params.cod_tipo || params.cod_tipo.split(",").includes(String(a.cod_tipo)))
    .map((a) => ({ ...a, asesor: nombres.get(String(a.cod_asesor)) ?? "" }));
}

// ── 2. Filtro propio → se conecta en `filtros` ──
const filtroTipoActividad: FiltroReporte = {
  id: "cod_tipo", // nombre del parámetro que recibe `consultar`
  label: "Tipo de actividad",
  multiple: true,
  depende: ["cod_usuario"], // se limpia al cambiar el asesor
  useOpciones: () => {
    const { data, isLoading } = tipos.useLista({ tipo_tabla: "ACTIVIDAD" });
    const opciones = React.useMemo<ComboboxOption[]>(
      () => (data ?? []).map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
      [data],
    );
    return { opciones, cargando: isLoading };
  },
};

// ── 3. Vista propia → se conecta en `Contenido` (por eso el archivo es .tsx) ──
function ContenidoEjemplo(props: ContenidoReporteProps<Fila>) {
  const finalizadas = props.filas.filter((f) => f.estado_desc === "FINALIZADO").length;
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {finalizadas} de {props.filas.length} actividades finalizadas
      </p>
      <TablaReporte {...props} />
    </div>
  );
}

// ── 4. Excel propio → se conecta en `descargas.excel` ──
async function excelEjemplo({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(titulo)}.xlsx`,
    titulo,
    encabezado,
    hojas: [
      {
        nombre: titulo.slice(0, 31),
        mostrarCuadricula: true,
        autoFiltro: true,
        columnas: ["Código", "Tipo", "Asesor", "Estado"],
        filas: filas.map((f): CeldaExcel[] => [
          f.cod_actividad,
          f.nom_tipo,
          f.asesor,
          f.estado_desc === "EN PROCESO"
            ? { dato: f.estado_desc, fontColor: "FFB30000" }
            : f.estado_desc,
        ]),
      },
    ],
  });
}

// ── 5. PDF propio → se conecta en `descargas.pdf` ──
function pdfEjemplo({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  return descargarPdf({
    titulo,
    header: encabezado,
    horizontal: true,
    contenido: [
      { tipo: "titulo", texto: "Resumen" },
      { tipo: "texto", texto: `${filas.length} actividades` },
      {
        tipo: "tabla",
        columnas: ["Código", "Tipo", "Asesor"],
        filas: filas.map((f) => [f.cod_actividad, f.nom_tipo, f.asesor]),
      },
    ],
  });
}

// ── La definición: aquí se conecta cada pieza ──
export const reporteEjemploC = definirReporte<Fila>({
  nomenclatura: "CRM-EC-92",
  fechas: "ninguna",
  filtros: [filtroUsuario("Asesor", "cod_usuario"), filtroTipoActividad], // ← 2
  consultar, // ← 1 (en lugar de consultarApi)
  Contenido: ContenidoEjemplo, // ← 3 (en lugar de la tabla)
  descargas: { excel: excelEjemplo, pdf: pdfEjemplo }, // ← 4 y 5 (en lugar de true)
  columnas: [
    { id: "codigo", label: "Código", valor: (f) => f.cod_actividad },
    { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
    { id: "asesor", label: "Asesor", valor: (f) => f.asesor, agrupable: true },
    { id: "estado", label: "Estado", valor: (f) => f.estado_desc, agrupable: true },
  ],
});
```
