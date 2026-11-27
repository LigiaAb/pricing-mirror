# Reportes: documentación

Explicación de cada parte de un reporte, por tema. Los pasos para agregar uno están en
[`GUIA.md`](GUIA.md).

## Cómo funciona un reporte

Un reporte es **un solo archivo** que exporta `definirReporte({ … })`. Cada propiedad de ese
objeto es una parte de la pantalla. Las que **no** se ponen usan lo de siempre; para cambiar
una, se escribe una función **en el mismo archivo, arriba**, y se pone en su propiedad:

| Propiedad   | Si no se pone / lo de siempre                  | Personalizada (función del mismo archivo)       |
| ----------- | ---------------------------------------------- | ----------------------------------------------- |
| `consultar` | (obligatoria) `consultarApi(endpoint, schema)` | `consultar: miConsulta`                         |
| `filtros`   | sin filtros extra                              | atajos (`filtroUsuario`…) o un filtro propio    |
| `Contenido` | tabla con las `columnas`                       | `Contenido: MiVista` (archivo `.tsx`)           |
| `descargas` | solo "Excel agrupado"                          | `excel: true` / `pdf: true` o funciones propias |
| `fechas`    | `"requeridas"` (mes actual)                    | `"opcionales"` / `"ninguna"`                    |

Nada de esto se configura en otro lado: no hay que tocar la pantalla ni otros archivos (salvo
registrarlo, [paso 4 de `GUIA.md`](GUIA.md#paso-4--registro)).

Otras opciones de la definición:

- `descripcion`: subtítulo de la sección "Reporte".
- `empresaCentroCosto: false`: el reporte no usa empresa ni CC (no se muestran ni se mandan).

## Nomenclatura (B)

`nomenclatura` = la `NOMENCLATURA` del `TIPO` del reporte, igual ([paso 1 de `GUIA.md`](GUIA.md#paso-1--base-de-datos)). Regla:
`[MÓDULO EN 3 CARACTERES]-[INICIALES DEL REPORTE]-[CORRELATIVO DEL MÓDULO]` (ej. `PRI-HR-01`).

## De dónde sale cada dato

| Dato (línea `// CAMBIAR`)                                       | De dónde sacarlo                                                                                                                                                                                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nomenclatura`                                                  | Se inventa con la regla `MÓDULO-INICIALES-CORRELATIVO` ([paso 1 de `GUIA.md`](GUIA.md#paso-1--base-de-datos)) y se guarda igual en `TIPO.NOMENCLATURA`.                                                                                                     |
| Endpoint (`/api/appweb/CAMBIAR`)                                | El nombre de la ruta del backend (`/api/appweb/<nombre>`). Si otra pantalla ya lo usa, buscar el nombre en `src/features/**/api/*.ts` (`http.get("/api/appweb/…")`) o verlo en la pestaña **Network** del navegador en esa pantalla.                        |
| Campos del schema (`campo_texto`, `campo_numero`)               | La respuesta del endpoint: pestaña **Network** → la petición → **Response** (copiar los nombres tal cual, en minúsculas). En el backend: los alias del `select` (`… AS NOMBRES` llega como `nombres`).                                                      |
| Nombres de los parámetros que espera el endpoint                | En el backend, la función del endpoint: lo que lee de `campos` (ej. `campos.fecha_inicio`, `campos.cod_cc`). Si son distintos a los de la pantalla (`fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc`), usar `nombres` (plantilla de endpoint distinto). |
| Dónde viene la lista (`lista`)                                  | La misma respuesta en **Network**: si las filas no están en `data` sino en `data.<algo>`, `lista: "<algo>"`.                                                                                                                                                |
| `id` de cada filtro                                             | El nombre del parámetro que el backend lee de `campos` para ese filtro (ej. `cod_usuario`, `cod_tipo_pago`).                                                                                                                                                |
| `filtroTipo("TIPO_TABLA", …)`                                   | La `TIPO_TABLA` de los tipos que se quieren listar (tabla `TIPO`; ej. `ACTIVIDAD`, `TIPO_PAGO`).                                                                                                                                                            |
| `filtroEstado("NOMBRE", …)`                                     | El `nom_tipo` de los estados (catálogo `estados`; ej. `ACTIVIDAD`).                                                                                                                                                                                         |
| Otros catálogos (consulta o filtro propios)                     | Todos los catálogos están en `src/features/catalogos/index.ts` (ej. `empleadosUsuarios`, `tipos`, `empresas`, `roles`, `modulos`).                                                                                                                          |
| `columnas` (`valor: (f) => f.campo`)                            | Los campos del schema de la misma copia.                                                                                                                                                                                                                    |
| `ROL_ID`, `MODULO_ID`, `CENCOS_ID`, `EMPRESA_ID` de la relación | Catálogos `roles` (`/api/appweb/lista-rol`), `modulos` (`/api/appweb/listamodulo`, el select Módulo de la pantalla), `centrosCosto` (`/api/appweb/listacentrocosto`) y `empresas` (`/api/appweb/listaempresas`).                                            |

## Schema de la fila y fechas

### Schema de la fila (A)

- Mira la respuesta real del endpoint (pestaña Network del navegador o el backend en
  `docs/backend/`) y copia los nombres **tal cual**.
- Texto: `z.string().nullable().catch("")`. Número: `z.coerce.number().catch(0)` (también
  convierte `"12"` y banderas `0/1`). Código: `zId` de `@/shared/lib/zod-scalars`.
- `z.looseObject` deja pasar los campos que no declares (no fallan).
- Si un campo no coincide con el schema, en desarrollo sale el error "API response failed
  schema validation" con el campo: corrige el schema.

### Fechas (C)

| `fechas`       | Pantalla                                   | Manda                       |
| -------------- | ------------------------------------------ | --------------------------- |
| `"requeridas"` | Fecha inicial y final con `*` (mes actual) | `fecha_inicio`, `fecha_fin` |
| `"opcionales"` | Fechas con "x" para limpiar                | solo las que tengan valor   |
| `"ninguna"`    | Sin fechas                                 | nada                        |

Formato: `yyyy-MM-dd`.

## Filtros (D)

Atajos de `src/features/reportes/lib/filtros.ts` (el segundo argumento es el **nombre del parámetro** que se manda):

| Atajo                                                             | Qué muestra                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `filtroUsuario("Asesor", "cod_asesor")`                           | Usuarios del CC elegido                                        |
| `filtroCliente("Cliente", "cod_cliente")`                         | Clientes por nombre, buscados en el servidor (mínimo 2 letras) |
| `filtroTipo("TIPO_PAGO", "cod_tipo_pago", "Tipo de pago")`        | Catálogo `TIPO` de esa `TIPO_TABLA`                            |
| `filtroEstado("ACTIVIDAD", "cod_estado")`                         | Estados del catálogo de ese tipo                               |
| `filtroLista("moneda", "Moneda", [{ value: "1", label: "GTQ" }])` | Opciones fijas                                                 |

Modificadores (se escriben así: `{ ...filtroTipo(…), multiple: true }`):

- `multiple: true`: varios valores; llega como `"7,8"` (separado por comas).
- `requerido: true`: obligatorio; sin valor no se puede consultar.

### Filtro propio

Un objeto `FiltroReporte` (los atajos de `lib/filtros.ts` devuelven lo mismo):

```ts
import React from "react";
import { tipos } from "@/features/catalogos";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import type { FiltroReporte } from "../../lib/definir-reporte";

const filtroTipoActividad: FiltroReporte = {
  id: "cod_tipo", // nombre del parámetro que recibe `consultar`
  label: "Tipo de actividad",
  multiple: true, // opcional: varios valores ("7,8")
  requerido: false, // opcional: obligatorio
  depende: ["cod_usuario"], // opcional: se limpia cuando cambia el filtro cod_usuario
  useValorInicial: () => "7", // opcional: valor con el que arranca (es un hook)
  // Hook que devuelve las opciones. Recibe los valores actuales de los filtros, por si
  // dependen de otro (ej. `valores.cod_cc`).
  useOpciones: (valores) => {
    const { data, isLoading } = tipos.useLista({ tipo_tabla: "ACTIVIDAD" });
    const opciones = React.useMemo<ComboboxOption[]>(
      () => (data ?? []).map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
      [data],
    );
    return { opciones, cargando: isLoading };
  },
};
```

- `value` siempre es **texto** (`String(...)`).
- `useOpciones` y `useValorInicial` son hooks: pueden usar `useLista` de un catálogo, stores,
  etc., y siguen las reglas de los hooks (siempre se llaman, sin `if`).
- Se usa igual que un atajo: `filtros: [filtroTipoActividad]`.
- **Lista muy grande** (ej. clientes): en lugar de `useOpciones`, `buscar: async (texto) => opciones`
  busca en el servidor mientras se escribe (mínimo 2 letras). Ejemplo: `filtroCliente` en
  `lib/filtros.ts`.
- Empresa y CC tampoco van aquí: los pone la pantalla.

## Consulta (E)

Opciones de `consultarApi(endpoint, schema, { … })`:

| Opción    | Para qué                                                               | Ejemplo                                                              |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `lista`   | La lista no viene en `data` (ej. `{ data: { tipo, detalle: [ … ] } }`) | `lista: "detalle"`                                                   |
| `params`  | Parámetro fijo que siempre se manda                                    | `params: { tipo: "mensual" }`                                        |
| `nombres` | El endpoint espera otro nombre (nombre de la pantalla → del endpoint)  | `nombres: { cod_empresa: "cod_emp", fecha_inicio: "fecha_inicial" }` |
| `filtrar` | Lo que el endpoint no filtra (`true` = la fila se queda)               | `filtrar: (f, params) => fechaEnRango(f.fecha, params)`              |

### Según cómo responde el endpoint

La pantalla arma los parámetros con estos nombres (los vacíos no se mandan):
`fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc` y el id de cada filtro.

1. **Responde la lista en `data` (lo normal)**: `{ data: { success, data: [ … ] } }`, `{ data: [ … ] }`
   o `[ … ]`.

   ```ts
   consultar: consultarApi("/api/appweb/report-icc", filaSchema),
   ```

2. **La lista viene en otra propiedad**: ej. `{ data: { tipo, detalle: [ … ] } }` → `lista`.
   **Necesita un parámetro fijo**: ej. `tipo=mensual` → `params`.

   ```ts
   consultar: consultarApi("/api/appweb/ENDPOINT", filaSchema, {
     lista: "detalle",
     params: { tipo: "mensual" },
   }),
   ```

3. **El endpoint espera OTROS nombres de parámetros** (ej. `cod_emp`, `fecha_inicial`): opción
   `nombres` (tabla de arriba). Si hay que juntar varias respuestas: `consultar` propio (abajo). Ejemplo completo: `consultar` de
   `crm/reporte-objetivos.tsx`.

   ```ts
   async function consultar(params: ParamsReporte): Promise<Fila[]> {
     const respuesta = await http.get<unknown>("/api/appweb/ENDPOINT", {
       params: { cod_emp: params.cod_empresa ?? "", fecha_inicial: params.fecha_inicio ?? "" },
     });
     return parseEnvelope(respuesta, filaSchema, "ENDPOINT");
   }
   ```

4. **El endpoint no filtra algo** (ej. no aplica las fechas): opción `filtrar` (tabla de arriba) o
   `consultar` propio. Ejemplo: `crm/reporte-visitas-historico.ts`.

Si el backend responde `success: false`, su mensaje se ve en la sección "Reporte".

### `consultar` propio

Una función `async (params) => Fila[]`. Recibe los parámetros de la pantalla (`fecha_inicio`,
`fecha_fin`, `cod_empresa`, `cod_cc` y el id de cada filtro; vacíos = no vienen) y devuelve las
filas. Cada endpoint se lee con `parseEnvelope(respuesta, filaSchema, "<endpoint>")`: el tercero es
el nombre del endpoint (la última parte de la URL, ej. `"lista-actividades2"`) y solo sirve para
saber qué consulta falló (sale en el error, o en Sentry en producción, si las filas no cumplen
`filaSchema`). Dentro se puede hacer lo que haga falta:

```ts
import { empleadosUsuarios } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ParamsReporte } from "../../lib/definir-reporte";

type Fila = z.infer<typeof filaSchema> & { asesor: string }; // la fila puede llevar campos extra

async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const [actividades, empleados] = await Promise.all([
    // 1) otros nombres de parámetros: se arman aquí
    http
      .get<unknown>("/api/appweb/ENDPOINT", {
        params: { cod_emp: params.cod_empresa ?? "", fecha_inicial: params.fecha_inicio ?? "" },
      })
      .then((r) => parseEnvelope(r, filaSchema, "ENDPOINT")),
    // 2) otro endpoint o catálogo (todos los catálogos tienen fetchLista)
    empleadosUsuarios.fetchLista({}),
  ]);
  const nombres = new Map(empleados.map((e) => [String(e.codUsuario), e.nombreCompleto]));
  return (
    actividades
      // 3) lo que el endpoint no filtra (aquí un filtro `multiple`: "7,8")
      .filter((a) => !params.cod_tipo || params.cod_tipo.split(",").includes(String(a.cod_tipo)))
      // 4) campos calculados o de otra consulta
      .map((a) => ({ ...a, asesor: nombres.get(String(a.cod_asesor)) ?? "" }))
  );
}
```

- **Respuesta que no es una lista de filas** (objetos con listas dentro): aplanarla aquí, una fila
  por lo que se quiera agrupar (ej. objetivo × empleado × periodo en `reporte-objetivos.tsx`).
- **El usuario de la sesión**: `useAuthStore.getState().user?.cod_usuario` (de
  `@/shared/stores/auth-store`; fuera de un componente se usa `getState()`).
- Un `throw new Error("mensaje")` se muestra en la sección "Reporte".

## Columnas (F)

| Propiedad   | Para qué                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| `id`        | Clave única (sin espacios). Se usa en `agrupacion` y en `calculada`.         |
| `label`     | Encabezado en pantalla, Excel y PDF.                                         |
| `valor`     | Qué se ve en cada fila: `(f) => f.campo`. Puede formatear o combinar campos. |
| `agrupable` | Aparece en "Personaliza tu reporte" (filas o columnas del resumen).          |
| `sumable`   | Se suma en el Resumen agrupado (además de la Cantidad).                      |
| `calculada` | Medida del resumen calculada con las sumas del grupo (porcentajes).          |
| `buscable`  | El buscador de la tabla busca en ella.                                       |
| `numerica`  | Alineada a la derecha (por defecto, si es `sumable` o `calculada`).          |

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

### Agrupación inicial (G)

`agrupacion: { filas: ["tipo"], columna: "estado" }`: agrupación inicial de "Personaliza tu
reporte" (ids de columnas `agrupable`; si un id no es de una columna `agrupable`, se ignora).

## Vista propia (`Contenido`) (I)

Un componente (archivo **`.tsx`**) que reemplaza la tabla de la sección "Reporte". Recibe
`{ filas, columnas, params }` (`params` = los de la última consulta) y las props del PDF (ver
_PDF generado por la vista_ en Descargas). Para dejar también la tabla de siempre, `TablaReporte`:

```tsx
import { TablaReporte } from "../../components/contenido-reporte";
import type { ContenidoReporteProps } from "../../lib/definir-reporte";

function ContenidoMiReporte(props: ContenidoReporteProps<Fila>) {
  const finalizadas = props.filas.filter((f) => f.estado_desc === "FINALIZADO").length;
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {finalizadas} de {props.filas.length} finalizadas
      </p>
      <TablaReporte {...props} />
    </div>
  );
}

// en la definición:  Contenido: ContenidoMiReporte,
```

- **Vista de otro módulo**: importar su componente **por su ruta** (ej.
  `@/features/reportes-crm/components/reporte-objetivos-empleado`), no por el `index` del módulo
  (el `index` trae todo el módulo).
- **Totales**: si `consultar` ya agrupa (ej. una fila por persona), el total no llega aparte: se
  saca en la vista sumando `filas` con `useMemo` (ej. `totalIcc` en `lib/crm/reporte-icc.ts`).
  A una tabla se le pasa `filas` sin copiar (`[...filas]` es un arreglo nuevo en cada render y la
  tabla vuelve a la página 1).
- **Datos que no son filas** (ej. los objetivos de las gráficas): `consultar` los guarda por
  parámetros y la vista los lee con `params`. Ver `reporte-graficas-objetivos.tsx`
  (`objetivosConsultados`).

## Descargas (H)

- **Excel agrupado**: siempre (el Resumen agrupado, con el generador de Reportes de pricing).
- `descargas: { excel: true }` y/o `pdf: true`: el detalle con las columnas.
- `descargas: { excel: miFuncion }` / `pdf: miFuncion`: formato propio (ver _Excel propio_ y _PDF propio_).
- `descargas: { pdf: "contenido" }`: el PDF lo genera el `Contenido` (ver _PDF generado por la vista_).
- Sin `descargas`: solo el Excel agrupado.

### Excel propio

Una función `async ({ filas, titulo, encabezado, params }) => void`. `encabezado` trae los filtros
de la consulta con nombre (Período, Empresa, Centro de costo, Asesor…). Con `exportarExcel` de
`@/shared/lib/excel`:

```ts
import { type CeldaExcel, exportarExcel } from "@/shared/lib/excel";
import type { DescargaReporte } from "../../lib/definir-reporte";
import { nombreArchivo } from "../../lib/exportar";

async function excelMiReporte({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(titulo)}.xlsx`, // "<título> - ERPWEB - <fecha>"
    titulo,
    encabezado, // u otro objeto { "Etiqueta:": "valor" }
    hojas: [
      {
        nombre: titulo.slice(0, 31), // Excel admite 31 caracteres
        mostrarCuadricula: true,
        autoFiltro: true,
        columnas: ["Código", "Tipo", "Estado"],
        filas: filas.map((f): CeldaExcel[] => [
          f.cod_actividad,
          f.nom_tipo,
          // celda con formato: { dato, fontColor } (color ARGB)
          f.estado_desc === "EN PROCESO"
            ? { dato: f.estado_desc, fontColor: "FFB30000" }
            : f.estado_desc,
        ]),
      },
    ],
  });
}

// en la definición:  descargas: { excel: excelMiReporte },
```

Otras opciones de la hoja: `columnaInicio` / `filaInicio` (márgenes), `anchos`, `color` de la
pestaña; varias hojas = varios objetos en `hojas`.

### PDF propio

Con el **formato de Reportes de pricing** (logo, título, encabezado): `descargarPdf` de
`lib/exportar.ts`, con la lista de bloques en el orden en que se imprimen:

```ts
import type { DescargaReporte } from "../../lib/definir-reporte";
import { descargarPdf } from "../../lib/exportar";

function pdfMiReporte({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  return descargarPdf({
    titulo,
    header: encabezado,
    horizontal: true, // opcional: carta horizontal
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

// en la definición:  descargas: { pdf: pdfMiReporte },
```

Bloques: `titulo`, `texto` (`weight`, `align`, `fontSize`), `tabla`, `fila` (bloques lado a lado,
`anchos` en %), `espacio` (`alto` en puntos) y `pagina` (salto de página). Detalle en
`pricing/reportes/lib/pdf-reporte.ts` (`BloquePdf`).

Un PDF con **diseño totalmente propio** (ej. el calendario de `reporte-actividades.ts`) usa jsPDF
directo y abre o descarga el archivo en la misma función.

### PDF generado por la vista

Cuando el PDF lo arma la propia vista (ej. una vista con gráficas que hay que capturar), el botón
PDF de la pantalla (el mismo de todos los reportes) se conecta con `pdf: "contenido"`:

```tsx
descargas: { excel: true, pdf: "contenido" },
```

El `Contenido` recibe tres props más:

| Prop             | Qué es                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| `solicitudPdf`   | Número que sube cada vez que se pulsa PDF: generar el PDF cuando cambie. |
| `onGenerandoPdf` | Avisar `true` / `false`: el botón muestra "Generando PDF...".            |
| `onErrorPdf`     | Mensaje de error (o `null`): sale junto a los de las demás descargas.    |

Ejemplo:

```tsx
import React from "react";
import { TablaReporte } from "../../components/contenido-reporte";
import type { ContenidoReporteProps } from "../../lib/definir-reporte";
import { descargarPdf } from "../../lib/exportar";

function VistaConPdf(props: ContenidoReporteProps<Fila>) {
  const { filas, encabezado, solicitudPdf, onGenerandoPdf, onErrorPdf } = props;
  const ultimaSolicitud = React.useRef(solicitudPdf);

  React.useEffect(() => {
    // Solo cuando se pulsa PDF (no al abrir la vista).
    if (solicitudPdf === ultimaSolicitud.current) return;
    ultimaSolicitud.current = solicitudPdf;
    onGenerandoPdf(true);
    onErrorPdf(null);
    descargarPdf({
      titulo: "Mi reporte",
      header: encabezado, // Período, Empresa, Centro de costo y cada filtro, ya armados
      contenido: [{ tipo: "texto", texto: `${filas.length} filas` }],
    })
      .catch((error) =>
        onErrorPdf(error instanceof Error ? error.message : "No se pudo generar el PDF."),
      )
      .finally(() => onGenerandoPdf(false));
  }, [solicitudPdf, filas, encabezado, onGenerandoPdf, onErrorPdf]);

  return <TablaReporte {...props} />;
}

// en la definición:  Contenido: VistaConPdf,  descargas: { pdf: "contenido" },
```

- **`header: encabezado`**: el encabezado del PDF (Período, Empresa, Centro de costo y cada filtro
  con su nombre) ya viene armado; no hace falta leer las fechas de `params`.
- **Con `usePdfReporte`** (el PDF de Reportes de pricing, con gráficas y leyendas): se le pasan las
  props al crearlo, `usePdfReporte({ onGenerando: onGenerandoPdf, onError: onErrorPdf })`, y dentro
  del `useEffect` se llama su `generar` (el hook avisa "Generando PDF..." y el error solo). Un solo
  `usePdfReporte` por vista. Caso real: `contenido/crm/icc.tsx`.

Si el PDF lo genera un componente que ya existe y se dispara con un número (como la vista de
descarga de Hit Rate, prop `descargar`), se le pasan las tres props tal cual: ver
`definiciones/pricing/reporte-hit-rate.tsx`.

## Ejemplos

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

| Opción    | Para qué                                                               | Ejemplo                                                              |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `lista`   | La lista no viene en `data` (ej. `{ data: { tipo, detalle: [ … ] } }`) | `lista: "detalle"`                                                   |
| `params`  | Parámetro fijo que siempre se manda                                    | `params: { tipo: "mensual" }`                                        |
| `nombres` | El endpoint espera otro nombre (nombre de la pantalla → del endpoint)  | `nombres: { cod_empresa: "cod_emp", fecha_inicio: "fecha_inicial" }` |
| `filtrar` | Lo que el endpoint no filtra (`true` = la fila se queda)               | `filtrar: (f, params) => fechaEnRango(f.fecha, params)`              |

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

### Reportes reales

En `src/features/reportes/definiciones/crm/`:

| Archivo                          | Qué personaliza                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `reporte-visitas-historico.ts`   | `consultar` (2 endpoints, fechas y tipo en el front) y Excel del legacy                                  |
| `reporte-actividades.ts`         | `consultar` del usuario de la sesión, PDF propio (calendario), sin empresa/CC                            |
| `reporte-objetivos.tsx`          | Parámetros con otros nombres, datos anidados y vista de CRM                                              |
| `reporte-graficas-objetivos.tsx` | Varias consultas, datos que no son filas y vista con gráficas                                            |
| `reporte-icc.tsx`                | `consultar` que agrupa por persona, vista con gráfica, total y PDF (`pdf: "contenido"`, `usePdfReporte`) |

## Errores comunes

| Síntoma                                                     | Causa / solución                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| El reporte no aparece en el select                          | Falta el `TIPO` o la relación con el rol/CC/módulo, o el `ESTADO_ID` no es 1.                               |
| "El reporte «…» (…) todavía no está configurado"            | La `NOMENCLATURA` del `TIPO` no coincide con `nomenclatura`, o falta el registro.                           |
| Empresa o Centro de costo salen dos veces                   | Se agregaron en `filtros`: quitarlos.                                                                       |
| Error de TypeScript en `valor: (f) => f.algo`               | `algo` no está en el schema de la fila.                                                                     |
| "API response failed schema validation"                     | Un campo del schema no coincide con lo que manda el endpoint (nombre o tipo).                               |
| Consulta vacía, pero el endpoint sí trae datos              | La lista no viene en `data`: usar `lista` (sección Consulta, opción `lista`).                               |
| El endpoint ignora un filtro                                | Espera otro nombre de parámetro: cambiar el id del filtro u opción `nombres` (sección Consulta).            |
| Un porcentaje sale sumado en el resumen                     | Usar `calculada`, no `sumable`.                                                                             |
| Biome marca formato o imports                               | `pnpm exec biome check --write <archivo>`.                                                                  |
| Error de JSX en el archivo del reporte                      | Con `Contenido` (o cualquier `<…>`) la extensión es `.tsx`.                                                 |
| La vista de otro módulo hace la pantalla muy pesada         | Importar el componente por su ruta, no por el `index` del módulo (sección Vista propia).                    |
| "Rendered more hooks…" o error de hooks en un filtro propio | `useOpciones` / `useValorInicial` no pueden tener hooks dentro de un `if` (sección Filtros, filtro propio). |
