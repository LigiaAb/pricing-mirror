# Tarifas: guía rápida

## ¿Dónde está cada cosa?

```
tarifas/
├─ api/
│  ├─ catalogo-metodo.ts    ← ADAPTADOR de métodos sobre createCatalogo (@/features/catalogos)
│  ├─ monedas.ts            ← consulta ÚNICA de monedas operativas (createCatalogo)
│  ├─ tarifa-*.ts           ← cada método: su esquema, su payload y sus endpoints
│  └─ ...                   ← servicios, métodos, clientes, proveedores, incoterms
├─ hooks/
│  ├─ use-catalogos-tarifas.ts   ← catálogos base de pricing/shared + opción "TODOS" + mapWithCatalogo
│  ├─ use-opciones-tarifa.ts     ← monedas / rubros como opciones { value, label } y búsqueda local
│  └─ use-formulario-tarifas.ts  ← formulario principal de tarifa
├─ lib/
│  ├─ campos-metodo.ts      ← reexporta el motor de definición única (vive en pricing/shared/lib/campos-metodo.ts)
│  ├─ metodos/<metodo>.ts   ← campos de cada método (migrados: costo-venta, cobertura, porcentaje, costo-porcentaje, equipo; rango en pricing/shared)
│  ├─ tarifa-field-rules.ts ← reglas de campos del formulario principal
│  └─ tarifa-helpers.ts     ← funciones compartidas (decimales, fechas, ...)
└─ components/
   └─ metodos/
      ├─ campo-metodo.tsx   ← dibuja un campo (etiqueta + input) desde su definición
      └─ <metodo>/          ← sin tabla: <metodo>.tsx (componente padre: datos + guardar) y -form.tsx
                              con tabla (rango, scalling): -columns, -form, -table
```

## Compartido con Cotizaciones (`pricing/shared`)

Tarifas no importa nada de Cotizaciones. Lo que usan ambos vive en `@/features/pricing/shared` y se re-exporta
desde el barrel de Tarifas para no romper importaciones existentes:

- `useCatalogosPricing` (carga y normalización de catálogos), `conAmbosFormatos`
- APIs: métodos, proveedores, clientes y la **lectura** de rangos (las mutaciones de rangos siguen en `api/tarifa-rangos.ts`)
- `FichaResumen` / `ResumenItem` y `getEstadoMetodo`

## Método nuevo (o endpoint nuevo)

Las APIs usan la fábrica estándar del proyecto, `createCatalogo` (@/features/catalogos), igual que los demás
módulos. `crearCatalogoMetodo` es solo un adaptador delgado que agrega lo propio de los métodos de tarifa:

- filtros como los usan los componentes (`{ codMetodo, codEstado }` → `cod_metodo`, `cod_estado`),
- "eliminar" = enviar `cod_estado: 4`,
- el tipo del payload de cada método en las mutaciones.

```ts
export const tarifaMiMetodoSchema = z.object({ ... }).passthrough();
export type TarifaMiMetodoMutationPayload = { ... };

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

## Campos de un método (definición única) — en migración

Migrados: **costoVenta**, **cobertura**, **porcentaje**, **costo-porcentaje**, **equipo** (`lib/metodos/<metodo>.ts`)
y **rango** (`pricing/shared/lib/metodos/rango.ts`, porque Cotizaciones lee su esquema).
De cada `METODO_<X>` salen el esquema, los tipos (registro, fila, payload), `aFila`, `aPayload`, `filaNueva`
y `validar` (requeridos + `reglas`). El formulario usa `<CampoMetodo>` con el mismo layout; cada campo dibuja
sus propios mensajes de error. Componentes padre reutilizables: `MetodoCostoVenta`, `MetodoCobertura`,
`MetodoPorcentaje`, `MetodoCostoPorcentaje`, `MetodoEquipo` (alias viejos `*Table` en el barrel).

Sigue a mano en los formularios (la definición igual da esquema, payload y validación):

- avisos de más de 8 decimales (cobertura, porcentaje, costo-porcentaje);
- `minimo: 0` inicial de porcentaje;
- costo-porcentaje: el input de venta (etiqueta, `max`, `step` y "%" cambian con `es_porcentaje`) y el radio
  Porcentaje / Valor. Su lado de costo está definido pero oculto; `cod_rubro` se envía sin estar en el esquema
  (`sinEsquema`).
- equipo: todo el markup del formulario (asteriscos, placeholders, símbolo en la etiqueta); usa la definición
  solo para validar. Sus selects guardan la opción en la misma llave del API (`cod_moneda_costo`, ...), las
  monedas usan `value` numérico y se envía `value || null` (campos `opcion`); al insertar no se envía
  `cod_tarifa_equipo` (lo quita `MetodoEquipo`).
- rango: el formulario (grilla de 7 columnas, montos en "" en vez de null) y la edición local con "Guardar todo";
  valida con la definición. Sus columnas salen de la definición con `columnasMetodo`
  (`components/metodos/columnas-metodo.ts`); el id, "A partir de..." y las acciones siguen a mano.

Los demás métodos se migran uno por uno.

## Pendiente (no es centralización)

- Agregar un campo a un método todavía requiere tocar su esquema, su payload, su formulario y su tabla.
- `porcentaje-form.tsx` inicializa `minimo: 0` en lugar de `minimo_costo` / `minimo_venta`
  (solo afecta si el input aparece vacío o en 0 al crear; lo enviado es igual).
