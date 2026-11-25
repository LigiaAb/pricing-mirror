# Guía: agregar un reporte

Paso a paso para agregar un reporte a la pantalla de Reportes. La arquitectura (qué hace cada
archivo) está en `ARQUITECTURA.md`; aquí solo lo que hay que hacer.

> **Plantillas para copiar** (en `src/features/reportes/definiciones/plantillas/`; cómo usarlas:
> paso 2): [`reporte-basico.ts`](definiciones/plantillas/reporte-basico.ts) ·
> [`reporte-endpoint-distinto.ts`](definiciones/plantillas/reporte-endpoint-distinto.ts) ·
> [`reporte-personalizado.tsx`](definiciones/plantillas/reporte-personalizado.tsx)

## Checklist

1. [ ] **Base de datos**: `TIPO` del reporte y su relación con rol/CC/módulo (paso 1).
2. [ ] **Archivo** del reporte: copiar una plantilla y cambiar las líneas `// CAMBIAR` (paso 2).
3. [ ] **Registro**: una línea en `src/features/reportes/definiciones/<modulo>/index.ts` (paso 3).
4. [ ] `npm run check:nuevos` sin errores (si Biome se queja del formato: `npm run biome:arreglar`).
5. [ ] Probarlo: elegir el módulo y el reporte, pulsar **Consultar**.

## Cómo funciona un reporte por dentro

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

## Paso 1 — Base de datos

1. Un registro en `TIPO`:
   - `TIPO_TABLA = 'REPORTE'`, `ESTADO_ID = 1`.
   - `TIPO_DESCRIPCION` = **título en pantalla** (ej. "Ventas por cliente").
   - `NOMENCLATURA` = **clave que une la base de datos con el código** (máximo 20 caracteres):
     `[MÓDULO EN 3 CARACTERES]-[INICIALES DEL REPORTE]-[CORRELATIVO DEL MÓDULO]`, correlativo de
     2 dígitos, sin contar "de" en las iniciales. Ej. `PRI-HR-01`, `CRM-OA-04`. Ver los usados
     en `src/features/reportes/definiciones/<modulo>/index.ts`.
2. Filas en `REPORTE_X_CC_X_MDULO_X_ROL` (`REPORTE_TIPO_ID` = el `TIPO_ID` de arriba) con
   `ROL_ID`, `EMPRESA_ID`, `CENCOS_ID` y `MODULO_ID`; `NULL` = todos.

Sin esto el reporte no aparece en el select, aunque el código esté listo.

## Paso 2 — Archivo del reporte

**Crear el archivo del reporte** como copia de una plantilla de
`src/features/reportes/definiciones/plantillas/`, con nombre propio en kebab-case, en la carpeta
del módulo (ej. `src/features/reportes/definiciones/pricing/reporte-ventas-cliente.ts`; si el
módulo aún no tiene carpeta, ver el paso 3), y **cambiar solo las líneas marcadas con
`// CAMBIAR`**. Los imports no se tocan: las plantillas están a la misma profundidad que las
carpetas de los módulos.

| Plantilla                         | Cuándo                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`reporte-basico.ts`](definiciones/plantillas/reporte-basico.ts)               | El endpoint responde la lista y recibe `fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc` y los filtros con esos nombres. |
| [`reporte-endpoint-distinto.ts`](definiciones/plantillas/reporte-endpoint-distinto.ts)    | El endpoint trae la lista en otra propiedad, espera otros nombres de parámetros, necesita un parámetro fijo o no filtra algo (ej. fechas). Se borran las opciones `// OPCIONAL` que no hagan falta. |
| [`reporte-personalizado.tsx`](definiciones/plantillas/reporte-personalizado.tsx)       | Hay que juntar varias consultas o agregar campos, o se quiere un filtro, vista, Excel o PDF propios. Para cada pieza `// OPCIONAL` que no se use: borrar su función **y** su línea `← N`; los imports que queden sin usar se quitan con `npx biome check --write --unsafe <archivo>`. |

Qué se cambia en las líneas `// CAMBIAR` (de dónde sacar cada dato: tabla de abajo):

1. **Nombre de la constante** (`reporteCambiar` → ej. `reporteVentasCliente`).
2. **`nomenclatura`**: la del `TIPO` (paso 1).
3. **Schema de la fila**: los campos del endpoint, con sus nombres exactos (ver *Referencia*).
4. **Endpoint** (`/api/appweb/CAMBIAR`).
5. **`fechas`**, **`filtros`** y **`columnas`** (ver *Referencia*).

Las plantillas compilan tal cual y no se registran (no aparecen en pantalla); la copia sí se
registra (paso 3). Cada plantilla ya llenada: **Ejemplos completos** (A, B y C), después de este paso.

### De dónde sale cada dato

| Dato (línea `// CAMBIAR`)                        | De dónde sacarlo                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `nomenclatura`                                   | Se inventa con la regla `MÓDULO-INICIALES-CORRELATIVO` (paso 1) y se guarda igual en `TIPO.NOMENCLATURA`. |
| Endpoint (`/api/appweb/CAMBIAR`)                 | El nombre de la ruta del backend (`/api/appweb/<nombre>`). Si otra pantalla ya lo usa, buscar el nombre en `src/features/**/api/*.ts` (`http.get("/api/appweb/…")`) o verlo en la pestaña **Network** del navegador en esa pantalla. |
| Campos del schema (`campo_texto`, `campo_numero`) | La respuesta del endpoint: pestaña **Network** → la petición → **Response** (copiar los nombres tal cual, en minúsculas). En el backend: los alias del `select` (`… AS NOMBRES` llega como `nombres`). |
| Nombres de los parámetros que espera el endpoint | En el backend, la función del endpoint: lo que lee de `campos` (ej. `campos.fecha_inicio`, `campos.cod_cc`). Si son distintos a los de la pantalla (`fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc`), usar `nombres` (plantilla de endpoint distinto). |
| Dónde viene la lista (`lista`)                   | La misma respuesta en **Network**: si las filas no están en `data` sino en `data.<algo>`, `lista: "<algo>"`. |
| `id` de cada filtro                              | El nombre del parámetro que el backend lee de `campos` para ese filtro (ej. `cod_usuario`, `cod_tipo_pago`). |
| `filtroTipo("TIPO_TABLA", …)`                    | La `TIPO_TABLA` de los tipos que se quieren listar (tabla `TIPO`; ej. `ACTIVIDAD`, `TIPO_PAGO`). |
| `filtroEstado("NOMBRE", …)`                      | El `nom_tipo` de los estados (catálogo `estados`; ej. `ACTIVIDAD`).                  |
| Otros catálogos (consulta o filtro propios)      | Todos los catálogos están en `src/features/catalogos/index.ts` (ej. `empleadosUsuarios`, `tipos`, `empresas`, `roles`, `modulos`). |
| `columnas` (`valor: (f) => f.campo`)             | Los campos del schema de la misma copia.                                            |
| `ROL_ID`, `MODULO_ID`, `CENCOS_ID`, `EMPRESA_ID` de la relación | Catálogos `roles` (`/api/appweb/lista-rol`), `modulos` (`/api/appweb/listamodulo`, el select Módulo de la pantalla), `centrosCosto` (`/api/appweb/listacentrocosto`) y `empresas` (`/api/appweb/listaempresas`). |

### Piezas de `reporte-personalizado.tsx`


- **Consulta propia** (`consultar`): recibe los parámetros de la pantalla (`fecha_inicio`,
  `fecha_fin`, `cod_empresa`, `cod_cc` y el `id` de cada filtro; vacíos = no vienen) y devuelve
  las filas. Puede llamar varios endpoints o catálogos (todos tienen `fetchLista`), aplanar
  respuestas anidadas (una fila por lo que se quiera agrupar, ej. `src/features/reportes/definiciones/crm/reporte-objetivos.tsx`) y
  agregar campos. El usuario de la sesión: `useAuthStore.getState().user?.cod_usuario`
  (`@/shared/stores/auth-store`). Un `throw new Error("mensaje")` se muestra en "Reporte".
- **Filtro propio** (`FiltroReporte`): `value` siempre es texto (`String(…)`). `useOpciones` (y
  `useValorInicial`, el valor con el que arranca) son hooks: siguen las reglas de los hooks
  (sin `if`). `useOpciones` recibe los valores de los demás filtros (ej. `valores.cod_cc`);
  `depende: ["cod_cc"]` lo limpia cuando cambia ese filtro; `requerido: true` lo hace obligatorio.
- **Vista propia** (`Contenido`): recibe `{ filas, columnas, params }`; `TablaReporte` deja la
  tabla de siempre. La vista de otro módulo se importa **por su ruta** (ej.
  `@/features/reportes-crm/components/reporte-objetivos-empleado`), no por su `index`. Datos que
  no son filas: ver `src/features/reportes/definiciones/crm/reporte-graficas-objetivos.tsx`.
- **Excel propio**: `exportarExcel` (`@/shared/lib/excel`); celda con formato
  `{ dato, fontColor }`; otras opciones de la hoja: `columnaInicio`, `filaInicio`, `anchos`,
  `color`; varias hojas = varios objetos en `hojas`. `encabezado` trae los filtros de la
  consulta con nombre (Período, Empresa, Centro de costo, Asesor…).
- **PDF propio**: `descargarPdf` usa el formato de Reportes de pricing. Bloques: `titulo`,
  `texto` (`weight`, `align`, `fontSize`), `tabla`, `fila` (bloques lado a lado, `anchos` en %),
  `espacio` y `pagina` (detalle en `src/features/pricing/reportes/lib/pdf-reporte.ts`). Un diseño totalmente
  propio usa jsPDF directo (ej. el calendario de `src/features/reportes/definiciones/crm/reporte-actividades.ts`).

Reportes reales para consultar en `src/features/reportes/definiciones/crm/`:

| Archivo                          | Qué personaliza                                                         |
| -------------------------------- | ----------------------------------------------------------------------- |
| `reporte-visitas-historico.ts`   | Consulta propia (2 endpoints, fechas y tipo en el front) y Excel del legacy |
| `reporte-actividades.ts`         | Consulta del usuario de la sesión, PDF propio (calendario), sin empresa/CC |
| `reporte-objetivos.tsx`          | Otros nombres de parámetros, datos anidados y vista de CRM              |
| `reporte-graficas-objetivos.tsx` | Varias consultas, datos que no son filas y vista con gráficas           |

## Ejemplos completos

Las plantillas ya llenadas: reportes completos que compilan y funcionan tal cual (probados con
`lista-actividades2`), para ver cómo queda cada caso. Equivalen a `reporte-basico.ts` (A),
`reporte-endpoint-distinto.ts` (B) y `reporte-personalizado.tsx` (C).

### Ejemplo A — básico

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

Atajos de `src/features/reportes/lib/filtros.ts` (el segundo argumento es el **nombre del parámetro** que se manda):

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

En `src/features/reportes/definiciones/<modulo>/index.ts`, importar el reporte y sumarlo a la lista (en orden de
correlativo):

```ts
import { reporteVentasCliente } from "./reporte-ventas-cliente";

export const REPORTES_PRI: readonly Reporte[] = [reporteVentasCliente];
```

**Módulo nuevo** (sin carpeta todavía):

1. Crear `src/features/reportes/definiciones/<modulo>/index.ts` copiando `src/features/reportes/definiciones/crm/index.ts` (cambiar el
   nombre de la lista, ej. `REPORTES_PRI`).
2. En `src/features/reportes/definiciones/index.ts`: `import { REPORTES_PRI } from "./pricing";` y
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
