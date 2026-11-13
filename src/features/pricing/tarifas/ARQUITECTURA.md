# Tarifas: guía rápida

## ¿Dónde está cada cosa?

```
tarifas/
├─ api/
│  ├─ catalogo-metodo.ts    ← ADAPTADOR de métodos sobre createCatalogo (@/features/catalogos)
│  ├─ monedas.ts            ← consulta ÚNICA de monedas operativas (createCatalogo)
│  ├─ tarifa-*.ts           ← cada método: sus endpoints (esquema y payload salen de lib/metodos/)
│  └─ ...                   ← servicios, métodos, clientes, proveedores, incoterms
├─ hooks/
│  ├─ use-catalogos-tarifas.ts   ← catálogos base de pricing/shared + opción "TODOS" + mapWithCatalogo
│  ├─ use-opciones-tarifa.ts     ← monedas / rubros como opciones { value, label } y búsqueda local
│  └─ use-formulario-tarifas.ts  ← formulario principal de tarifa
├─ lib/
│  ├─ campos-metodo.ts      ← reexporta el motor de definición única (vive en pricing/shared/lib/campos-metodo.ts)
│  ├─ metodos/<metodo>.ts   ← DEFINICIÓN ÚNICA de los campos de cada método (rango: pricing/shared/lib/metodos/rango.ts)
│  ├─ tarifa-field-rules.ts ← reglas de campos del formulario principal
│  └─ tarifa-helpers.ts     ← funciones compartidas (decimales, fechas, ...)
└─ components/
   └─ metodos/
      ├─ campo-metodo.tsx   ← dibuja un campo (etiqueta + input + errores) desde su definición
      ├─ columnas-metodo.ts ← columnas de tabla desde la definición (rango, scalling)
      └─ <metodo>/          ← sin tabla: <metodo>.tsx (componente padre: datos + guardar) y -form.tsx
                              con tabla (rango, scalling): -columns, -form, -table
```

## Compartido con Cotizaciones (`pricing/shared`)

Tarifas no importa nada de Cotizaciones. Lo que usan ambos vive en `@/features/pricing/shared` y se re-exporta
desde el barrel de Tarifas para no romper importaciones existentes:

- `useCatalogosPricing` (carga y normalización de catálogos), `conAmbosFormatos`
- APIs: métodos, proveedores, clientes y la **lectura** de rangos (las mutaciones de rangos siguen en `api/tarifa-rangos.ts`)
- El motor de definición única de campos (`lib/campos-metodo.ts`) y la definición de rango (`lib/metodos/rango.ts`)
- `FichaResumen` / `ResumenItem` y `getEstadoMetodo`

## Método nuevo (o endpoint nuevo)

Las APIs usan la fábrica estándar del proyecto, `createCatalogo` (@/features/catalogos), igual que los demás
módulos. `crearCatalogoMetodo` es solo un adaptador delgado que agrega lo propio de los métodos de tarifa:

- filtros como los usan los componentes (`{ codMetodo, codEstado }` → `cod_metodo`, `cod_estado`),
- "eliminar" = enviar `cod_estado: 4`,
- el tipo del payload de cada método en las mutaciones.

```ts
// Campos: lib/metodos/mi-metodo.ts (ver "Campos de un método")
export const tarifaMiMetodoSchema = METODO_MI_METODO.esquema;
export type TarifaMiMetodoMutationPayload = typeof METODO_MI_METODO.tipos.payload;

const api = crearCatalogoMetodo<typeof tarifaMiMetodoSchema, TarifaMiMetodoMutationPayload>({
  nombre: "tarifas-mi-metodo",              // único: raíz de las query keys
  schema: tarifaMiMetodoSchema,
  endpoints: { lista: "lista-x", insertar: "insertar-x", actualizar: "actualizar-x" },
  // enviarEstado: true,                   ← si la consulta manda cod_estado
  // habilitado: (filtros) => ...,         ← por defecto: cuando hay codMetodo
  // endpoints.eliminar: "eliminar-x",     ← por defecto eliminar usa el endpoint de actualizar
});

export const TARIFA_MI_METODO_QUERY_KEY = api.keys.all;
export const { listaOptions: ..., useLista: ..., useInsertar: ..., useActualizar: ..., useEliminar: ... } = api;
```

Si un catálogo no necesita esas adaptaciones, usa `createCatalogo` directamente (ver `pricing/shared/api/metodos.ts`, `api/monedas.ts`).

Comportamiento heredado de `createCatalogo`: las mutaciones validan la respuesta con `exigirExitoDeMutacion`,
refrescan la lista al terminar (`onSettled`) y los toasts se controlan con `meta`.

## Monedas, rubros y búsquedas en selects

- Consulta: `useMonedasOperativas()` (los nombres viejos `useMonedasPorcentaje`, `useMonedasEquipo`, ... siguen funcionando).
- Opciones para un select: `useOpcionesMonedas(query.data)` y `useOpcionesRubros(rubros.data)`.
- Búsqueda local en un `AsyncComboboxInput`: `const fetchX = useFiltroOpciones(opciones);`

Excepción: **equipo** convierte monedas con `value` numérico porque ese valor se envía tal cual al backend.

## Campos de un método (definición única)

Cada método declara sus campos **una sola vez** en `lib/metodos/<metodo>.ts` (rango:
`pricing/shared/lib/metodos/rango.ts`, porque Cotizaciones lee su esquema). El motor es
`pricing/shared/lib/campos-metodo.ts` (reexportado en `lib/campos-metodo.ts`):

```ts
export const METODO_COSTO_VENTA = definirMetodo({
  id: { cod: "cod_tarifa_costoventa", siFalta: null },   // siFalta: lo que se envía si es nuevo
  campos: {                                              // el orden es el del payload
    cod_servicio: delContexto("codServicio"),
    costo: monto({ label: "Costo", requerido: true, formulario: { step: "0.1", simboloDe: "moneda_costo" } }),
    cod_moneda_costo: moneda({ label: "Moneda de costo", en: "moneda_costo", requerido: true }),
    cod_estado: fijo(1, { esquema: zId }),
    ...
  },
  reglas: [ventaNoMenorQueCosto("costo", "venta", "El valor de venta debe ser ...")],
});
```

De `METODO_<X>` sale todo lo demás:

| Qué | Dónde se usa |
| --- | --- |
| `esquema` (Zod de la lista) y `tipos.registro` | `api/tarifa-<metodo>.ts` |
| `tipos.payload` y `aPayload(fila, { codMetodo, codServicio })` | componente padre / tabla (insertar, actualizar) |
| `tipos.fila` y `aFila(registro, { monedas, rubros, ... })` (busca las opciones de los selects) | componente padre / tabla |
| `filaNueva()` (campos con `inicial`) | formulario, al crear |
| `validar(fila)` → `{ valido, faltantes, errores }` (requeridos + reglas) | formulario (botón y mensajes) |
| `<CampoMetodo {...campo} campo="costo" />` (etiqueta, input y errores del campo) | formulario |
| `columnasMetodo(METODO_X, ["costo", "cod_moneda_costo"])` | `-columns.tsx` (rango, scalling) |

Tipos de campo: `monto`, `moneda`, `rubro`, `opcion` (cualquier catálogo `{ value, label }`), `booleano`,
`fijo`, `delContexto` y `propio` (salida a mano). Si un campo no se comporta como su tipo, se sobrescribe solo
esa parte (`aPayload`, `falta`, `labelFaltante`, `buscarPor`, ...) o se usa `sinEsquema` / `propio`, en lugar de
forzar la abstracción.

### ¿Cómo agrego un campo a un método?

1. **Una línea en `lib/metodos/<metodo>.ts`**, en `campos` (en el orden en que debe ir en el payload), por ejemplo
   `minimo: monto({ label: "Mínimo", inicial: 0 })`. Con eso ya quedan el esquema, los tipos, el payload, la
   fila nueva y la validación (si es `requerido` o tiene reglas).
2. Si se ve en pantalla: `<CampoMetodo {...campo} campo="minimo" />` en su `-form.tsx`, donde va en la grilla
   (equipo, rango y scalling tienen el formulario a mano: ahí se agrega el input con su markup).
3. Si va en la tabla (rango, scalling): su código en la lista de `columnasMetodo` de `-columns.tsx`.

### Componentes padre reutilizables

`MetodoCostoVenta`, `MetodoCobertura`, `MetodoPorcentaje`, `MetodoCostoPorcentaje`, `MetodoEquipo`
(consulta + formulario + guardado): en otra pantalla basta con `<MetodoCostoVenta codMetodo={...} />`.
Los nombres viejos (`CostoVentaTable`, `CoberturaTable`, ...) siguen en el barrel como alias.
Rango y scalling conservan `-columns`, `-form` y `-table` (`RangoTable`, `ScallingTable`).

### Lo que sigue a mano (se conservó el comportamiento existente)

- Avisos de más de 8 decimales (cobertura, porcentaje, costo-porcentaje); `minimo: 0` inicial de porcentaje.
- costo-porcentaje: el input de venta (etiqueta, `max`, `step` y "%" cambian con `es_porcentaje`) y el radio
  Porcentaje / Valor. Su lado de costo está definido pero oculto; `cod_rubro` se envía sin estar en el esquema
  (`sinEsquema`).
- equipo: todo el markup del formulario (asteriscos, placeholders, símbolo en la etiqueta); usa la definición
  para validar. Sus selects guardan la opción en la misma llave del API (`cod_moneda_costo`, ...), las monedas
  usan `value` numérico y se envía `value || null` (campos `opcion`); al insertar no se envía
  `cod_tarifa_equipo` (lo quita `MetodoEquipo`).
- rango: el formulario (grilla de 7 columnas, montos en "" en vez de null) y la edición local con "Guardar
  todo". Columnas id, "A partir de..." y acciones.
- scalling: el tipo de punto de enlace (no se envía: al leer sale del punto y en el formulario filtra los
  puntos), el formulario y las columnas tipo y acciones.
- El JSON enviado conserva valores, pero el orden de llaves sigue `cod_metodo` primero y luego `campos`
  (equipo y rango tenían otro orden; el backend no depende del orden).

## Pendiente (no es centralización)

- `api/crear-api-metodo.ts` no se usa en ningún lado (se puede borrar).
- `porcentaje-form.tsx` inicializa `minimo: 0` en lugar de `minimo_costo` / `minimo_venta`
  (solo afecta si el input aparece vacío o en 0 al crear; lo enviado es igual).
