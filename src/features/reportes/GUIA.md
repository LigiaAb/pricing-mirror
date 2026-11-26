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

Si el reporte necesita algo que la plantilla no cubre (consulta, filtro, vista, Excel o PDF
propios), ver **Reportes personalizados** al final.

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

### Plantilla

Las plantillas para copiar están en `src/features/reportes/definiciones/plantillas/` (se cambian
las líneas marcadas `// CAMBIAR`):
[`reporte-basico.ts`](definiciones/plantillas/reporte-basico.ts),
[`reporte-endpoint-distinto.ts`](definiciones/plantillas/reporte-endpoint-distinto.ts) y
[`reporte-personalizado.tsx`](definiciones/plantillas/reporte-personalizado.tsx).
Explicación completa (cómo funciona, de dónde sale cada dato, ejemplos completos y referencia): [`DOCUMENTACION.md`](DOCUMENTACION.md).

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

2. **La lista viene en otra propiedad**: ej. `{ data: { tipo, detalle: [ … ] } }` → `lista`.
   **Necesita un parámetro fijo**: ej. `tipo=mensual` → `params`.

   ```ts
   consultar: consultarApi("/api/appweb/ENDPOINT", filaSchema, {
     lista: "detalle",
     params: { tipo: "mensual" },
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

**Porcentajes** (ej. % de ofertas ganadas = ganadas / ofertas): NO marcarlos `sumable` (sumar
porcentajes no tiene sentido). Las partes son `sumable` y el porcentaje `calculada`, que recibe
las sumas del grupo por `id`:

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

### (H) Descargas

- **Excel agrupado**: siempre (el Resumen agrupado, con el generador de Reportes de pricing).
- `descargas: { excel: true }` y/o `pdf: true`: el detalle con las columnas.
- `descargas: { excel: miFuncion }` / `pdf: miFuncion`: formato propio (ver **Reportes
  personalizados**, P4 y P5).
- `descargas: { pdf: "contenido" }`: el PDF lo genera el `Contenido` (ej. gráficas); con el mismo
  botón PDF, el `Contenido` recibe `solicitudPdf` (sube en cada clic), `onGenerandoPdf` y `onErrorPdf`.
- Sin `descargas`: solo el Excel agrupado.

### Otras opciones

- `empresaCentroCosto: false`: el reporte no usa empresa ni CC (no se muestran ni se mandan).
- `Contenido: MiComponente` (archivo `.tsx`): otra vista en lugar de la tabla (ver **Reportes
  personalizados**, P3).

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

## Reportes personalizados

Cuando la configuración básica no alcanza, cada pieza se puede reemplazar por una propia **sin
tocar la pantalla**: el resto (botones, "Personaliza tu reporte", Resumen y Excel agrupado,
empresa/CC) sigue funcionando igual. Se personaliza solo lo que haga falta.

| Necesito…                                                      | Pieza                         | Receta |
| -------------------------------------------------------------- | ----------------------------- | ------ |
| Otros nombres de parámetros, varios endpoints, filtrar en front | `consultar` propio            | P1     |
| Un filtro que no está en los atajos                             | objeto `FiltroReporte`        | P2     |
| Gráficas, tarjetas o la vista de otro módulo                    | `Contenido`                   | P3     |
| Excel con otro formato (colores, columnas, encabezado)          | `descargas.excel` (función)   | P4     |
| PDF con otro contenido                                          | `descargas.pdf` (función)     | P5     |

Ejemplos reales en `definiciones/crm/`:

| Archivo                          | Qué personaliza                                                         |
| -------------------------------- | ----------------------------------------------------------------------- |
| `reporte-visitas-historico.ts`   | `consultar` (2 endpoints, fechas y tipo en el front) y Excel del legacy |
| `reporte-actividades.ts`         | `consultar` del usuario de la sesión, PDF propio (calendario), sin empresa/CC |
| `reporte-objetivos.tsx`          | Parámetros con otros nombres, datos anidados y vista de CRM             |
| `reporte-graficas-objetivos.tsx` | Varias consultas, datos que no son filas y vista con gráficas           |

### P1 — `consultar` propio

Una función `async (params) => Fila[]`. Recibe los parámetros de la pantalla (`fecha_inicio`,
`fecha_fin`, `cod_empresa`, `cod_cc` y el id de cada filtro; vacíos = no vienen) y devuelve las
filas. Dentro se puede hacer lo que haga falta:

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

### P2 — Filtro propio

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
- Empresa y CC tampoco van aquí: los pone la pantalla.

### P3 — Vista propia (`Contenido`)

Un componente (archivo **`.tsx`**) que reemplaza la tabla de la sección "Reporte". Recibe
`{ filas, columnas, params }` (`params` = los de la última consulta). Para dejar también la tabla
de siempre, `TablaReporte`:

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
- **Datos que no son filas** (ej. los objetivos de las gráficas): `consultar` los guarda por
  parámetros y la vista los lee con `params`. Ver `reporte-graficas-objetivos.tsx`
  (`objetivosConsultados`).

### P4 — Excel propio

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
          f.estado_desc === "EN PROCESO" ? { dato: f.estado_desc, fontColor: "FFB30000" } : f.estado_desc,
        ]),
      },
    ],
  });
}

// en la definición:  descargas: { excel: excelMiReporte },
```

Otras opciones de la hoja: `columnaInicio` / `filaInicio` (márgenes), `anchos`, `color` de la
pestaña; varias hojas = varios objetos en `hojas`.

### P5 — PDF propio

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
| Error de JSX en el archivo del reporte                      | Con `Contenido` (o cualquier `<…>`) la extensión es `.tsx`.                        |
| La vista de otro módulo hace la pantalla muy pesada         | Importar el componente por su ruta, no por el `index` del módulo (P3).             |
| "Rendered more hooks…" o error de hooks en un filtro propio | `useOpciones` / `useValorInicial` no pueden tener hooks dentro de un `if` (P2).    |
