# Cotizaciones: guía rápida

## ¿Dónde está cada cosa?

```
cotizacion/calculo/
├─ lib/
│  ├─ tipos.ts          ← TIPOS compartidos (Id, MonedaCatalogo, RubroCatalogo, ...)
│  ├─ constantes.ts     ← CÓDIGOS de negocio (TIPO_PAGO.COLLECT = 127, RUBRO.SCALLING = 134, ...)
│  ├─ utils.ts          ← FUNCIONES pequeñas compartidas (mismoId, numero, formatNumero, getSimboloMoneda, ...)
│  ├─ catalogos.ts      ← normalización de catálogos a { value, label }
│  ├─ cabecera.ts       ← CAMPOS DE LA CABECERA (definición única)
│  ├─ detalle-flete.ts  ← TEXTO DEL DETALLE DE FLETE por tipo de transporte
│  └─ *.ts              ← lógica pura de cada sección (due-agent, scalling, totales-rubros, ...)
├─ hooks/
│  ├─ use-catalogos-cotizacion.tsx  ← TODOS LOS CATÁLOGOS (provider + hook)
│  └─ use-*.ts          ← estado de cada sección
├─ components/          ← lo visual
│  └─ utils.tsx         ← COMPONENTES reutilizables (tooltip, Detalles, ValorMoneda, Grupo...)
└─ api/                 ← llamadas al backend
```

**Reutilizables:** una función sin JSX que se usa en varios archivos va en `lib/utils.ts`; un componente visual que
se repite va en `components/utils.tsx`. Antes de escribir un helper nuevo, revisa esos dos archivos.

**Regla:** si cambia *cómo se calcula* algo, va en `lib/`. Si cambia *cuándo o con qué datos*, va en `hooks/`. Si cambia *cómo se ve*, va en `components/`.

## Catálogos

`GestionCotizacion` monta `<CatalogosCotizacionProvider>`. Cualquier componente o hook que esté dentro de esa pantalla lee los catálogos así, sin recibirlos por props:

```ts
const { calculo, formulario, criterios, codigosFletes, codRubroIVA, tarifas } = useCatalogosCotizacion();

const { monedas, metodos } = useCatalogosCotizacion().calculo;
```

| Campo         | Qué contiene                                                                 |
|---------------|------------------------------------------------------------------------------|
| `calculo`     | monedas, rubros, servicios, métodos, proveedores, tipos, categorías, puntos de enlace, unidades, reason codes |
| `formulario`  | opciones `{ value, label }` del formulario y de la tabla de cabeceras        |
| `criterios`   | opciones de los criterios dinámicos por campo (equipo, commodity...)         |
| `tarifas`     | catálogos crudos de `useCatalogosTarifas` (sin normalizar)                   |
| `codigosFletes`, `codRubroIVA` | valores derivados de los rubros                             |

### Agregar un catálogo nuevo

1. Si el tipo es nuevo, decláralo en `lib/tipos.ts`.
2. En `hooks/use-catalogos-cotizacion.tsx`, agrégalo al tipo `CatalogosCalculo` y en `construirCatalogosCalculo`
   (o en `construirCatalogosFormulario` si es para el formulario).
3. Úsalo donde lo necesites: `const { miCatalogo } = useCatalogosCotizacion().calculo;`

Ya no hace falta tocar `gestion-cotizacion`, `calculo-cotizacion-container`, `calculo-cotizacion` ni las Props de los hijos.

### Excepciones (siguen recibiendo catálogos por prop)

- `CotizacionForm`: también la usan **Autorización Spot** y **Plantillas de clientes**. Si recibe `catalogos` por prop, usa esos;
  si no, toma `formulario` del provider.
- `FichaResumen`: también la usa **Tarifas** (fuera del provider), por eso lee `useCatalogosTarifas` directamente.

## Cabecera de la cotización

Todos los campos de la cabecera se declaran **una sola vez** en `lib/cabecera.ts` (`CAMPOS_CABECERA`):

```ts
tipoCarga: {
  cod: "cod_tipo_carga",          // nombre en el backend
  esquema: id(),                  // validación al leer (id(), texto(), fecha() o cualquier Zod)
  label: "Tipo de carga",         // texto en el formulario y en "favor de completar"
  formulario: {                   // si lo tiene, el campo está en el formulario
    catalogo: "tiposCarga",       //   catálogo del select
    reset: ["otroCampo"],         //   campos que se limpian al cambiar este
    require: "otroCampo",         //   no se edita hasta que otroCampo tenga valor
    readonly: true,               //   no editable
    requerido: true,              //   obligatorio
  },
  calculo: true,                  // se envía al cálculo de tarifas
  filtro: true,                   // se puede filtrar el listado por este campo
  filtroApi: true,                // el filtro además se envía al backend
},
```

A partir de esa lista se generan solos:

| Qué                                          | Antes estaba escrito a mano en                      |
|----------------------------------------------|-----------------------------------------------------|
| Esquema Zod y tipo `CotizacionCabecera`      | `api/cotizacion-cabecera.ts`                        |
| Tipo `CotizacionCabeceraPayload`             | `api/cotizacion-cabecera.ts` (otra vez)             |
| Reglas del formulario                        | `hooks/use-formulario-cotizacion.ts`                |
| Lista de campos obligatorios                 | `hooks/use-formulario-cotizacion.ts`                |
| Etiquetas del formulario                     | `components/cotizacion-form.tsx`                    |
| Filtros del listado y parámetros al backend  | `api/cotizacion-cabecera.ts`, `hooks/use-gestion-cotizaciones.ts` (3 funciones de conversión) |
| Datos que van al cálculo                     | `components/gestion-cotizacion.tsx` (`construirFiltrosCalculo`) |
| Tipo de `cotizacion` en el cálculo           | `components/calculo-cotizacion.tsx`                 |

### Agregar un campo a la cabecera

1. Agrega una entrada en `CAMPOS_CABECERA` (`lib/cabecera.ts`).
2. Si se ve en el formulario, colócalo en el JSX de `components/cotizacion-form.tsx`, dentro del grupo que corresponda:
   `{renderSelect("miCampo")}` o `{renderText("miCampo")}`.

Si necesita un catálogo nuevo, agrégalo antes en `use-catalogos-cotizacion.tsx` (ver sección Catálogos).

Los filtros usan los mismos nombres que el backend (`cod_empresa`, `cod_cc`...), ya no hay versión camelCase.

## Detalle del flete por tipo de transporte

El texto de detalle de los rubros de flete (ej. `CW: 120 / $2.50 Por KILO`) se arma en **una sola función**,
`construirDetalleFlete` en `lib/detalle-flete.ts`. La usan el flete normal y el flete Spot; la diferencia
entre ambos (qué valor se muestra) la indica el campo `tipo: "normal" | "spot"`.

Para cambiar el texto de un transporte, edita `DETALLE_FLETE_POR_TRANSPORTE`:

```ts
[TIPO_TRANSPORTE.MARITIMO]: {
  etiqueta: "CW",            // texto antes de los dos puntos
  unidadTarifa: "Por KILO",  // unidad de la tarifa
  // Opcional: formato totalmente distinto (normal y Spot pueden diferir)
  textoEspecial: ({ tipo, valorCw, simbolo, rate, minimo }) =>
    tipo === "spot" ? `...` : `...`,
},
```

Un transporte con `null` en la tabla (o que no esté en ella) **no lleva detalle de flete**. Hoy Marítimo y Terrestre
están en `null` hasta que el departamento defina sus textos; para activarlos, cambia `null` por su configuración.
El cambio solo afecta lo que se calcula de ahora en adelante; las versiones guardadas conservan su texto.

## Estados de versiones

`useEstadosCotizacion()` (`hooks/use-estados-cotizacion.ts`) resuelve los estados del catálogo; `estados` es `null`
mientras carga o si falta alguno (`faltantes` dice cuáles). `CalculoCotizacionContainer` valida esto antes de montar
el cálculo y muestra un aviso si faltan estados. Dentro del cálculo se usa `useEstadosCalculo()`, que garantiza
`estados` no nulo.

## Flujo del cálculo (`calculo-cotizacion.tsx`)

| # | Sección          | Hook                             | Lógica (`lib/`)                                   | Componente                    |
|---|------------------|----------------------------------|---------------------------------------------------|-------------------------------|
| 1 | Versiones        | `use-version-cotizacion`         | `versiones.ts`                                    | `versiones-table`             |
| 2 | Criterios        | `use-criterios-cotizacion`       | `criterios-cotizacion`, `calculadora-medidas`     | `criterios-form`              |
| 3 | Cálculo (backend)| `use-calculo-cotizacion`         | —                                                 | —                             |
| 4 | Carrier / Flete  | `use-carrier-flete`              | `carrier-flete.ts`                                | `carrier-selector`            |
| 5 | Repartir rubros  | `use-rubros-cotizacion`          | `procesar-rubros-calculados`, `rubros-guardados`  | —                             |
| 6 | Due Agent        | `use-rubros-due-agent`           | `due-agent.ts`                                    | `due-agent`                   |
| 7 | Due Carrier/Spot | `use-rubros-due-carrier`         | `due-carrier.ts`                                  | `due-carrier`, `dialogo-spot` |
| 8 | Scalling         | `use-rubros-scalling`            | `scalling.ts`                                     | `scalling`                    |
| 9 | Totales          | `use-totales-rubros`             | `totales-rubros.ts`, `agrupacion-rubros.ts`       | `totales-rubros`              |
|10 | Guardar          | `use-guardar-version-cotizacion` | `guardar-version.ts`                              | `spot-documento-dialog`       |

## Pendientes conocidos

- `criterios` (opciones de equipo/commodity...) y `calculo.criterios` llegan vacíos, igual que antes: falta conectar sus fuentes reales
  (marcado con `TODO` en `use-catalogos-cotizacion.tsx`).
- Las reglas especiales del formulario que dependen de otros valores (por ejemplo: ciudad obligatoria solo si es
  TERRESTRE, países filtrados para terrestre) siguen en `hooks/use-formulario-cotizacion.ts`
  (`verificarSiEsRequerido`, `obtenerCatalogoById`).
