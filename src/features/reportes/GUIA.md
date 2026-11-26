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

### Ejemplos completos

Las plantillas ya llenadas: reportes completos que compilan y funcionan tal cual (probados con
`lista-actividades2`), para ver cómo queda cada caso. Equivalen a `reporte-basico.ts` (A),
`reporte-endpoint-distinto.ts` (B) y `reporte-personalizado.tsx` (C).

#### Ejemplo A — básico

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

#### Ejemplo B — endpoint distinto (sin funciones propias)

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

#### Ejemplo C — personalizado (funciones propias)

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
