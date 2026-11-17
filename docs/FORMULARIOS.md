# Formularios (`FormBuilder`)

```tsx
import { FormBuilder } from "@/shared/components/form/base-form";
import type { FormSection } from "@/shared/components/form/types";
```

`FormBuilder` valida con zod (`schema`), infiere el tipo de `onSubmit` y valida al primer blur de cada campo (`mode="onTouched"`). Tipar `sections` como `FormSection<MisValores>[]` hace que `name` y `resetOnChange` solo acepten claves del schema.

## ¿Qué selector uso?

| Necesito                                   | `type`                                         | Valor del formulario |
| ------------------------------------------ | ---------------------------------------------- | -------------------- |
| Pocas opciones fijas, sin buscar           | `select` + `searchable: false`                 | `string`             |
| Opciones fijas buscables (en memoria)      | `select` / `combobox` + `options`              | `string`             |
| Opciones de un catálogo del API            | `catalogo` + `catalogo: catalogoOpciones(...)` | `string`             |
| Búsqueda en el servidor (padrones grandes) | `async` + `buscar`                             | `string`             |

Todos comparten el contrato: el valor es el `value` de la opción como `string` y `""` significa vacío. El label, el foco al primer error, `aria-*` y el estado touched los pone el builder; **no** escribas un componente por selector.

### Catálogo

```ts
// a nivel de módulo: el hook se invoca dentro del campo
const opcionesPais = catalogoOpciones(
  () => paises.useLista(),
  (p) => ({ value: String(p.cod_pais), label: p.nombre_pais }),
);

{ name: "cod_pais", label: "País", type: "catalogo", catalogo: opcionesPais }
```

`fixedValue: "HONDURAS"` (por `value` o etiqueta) fija y bloquea el campo una vez cargado el catálogo; si el formulario deshabilita el campo (modo revisar) se respeta el valor del registro. Dentro de diálogos/sheets modales usar `portalled: false`.

### Búsqueda en el servidor

```ts
{
  name: "cliente", label: "Cliente", type: "async",
  buscar: buscarClientes,            // (texto, signal) => Promise<FieldOption[]>
  buscarQueryKey: "clientes-buscar", // caché compartida
  minSearchLength: 3,                // 0 = consulta al abrir
  initialOptions: [{ value: "7", label: "Acme" }], // etiqueta del valor inicial (edición)
}
```

## Fuera del builder

`Combobox` (`ui/combobox`) es el selector síncrono para pantallas sueltas; `AsyncComboboxInput` el asíncrono con valor objeto (filtros, tablas editables). No envuelvas datos en memoria con `AsyncComboboxInput`: usa `Combobox`.

## Tipado

- `onSubmit` recibe la **salida** del schema (con `z.coerce.number()` ya es `number`).
- `defaultValues` se tipa con la **entrada** del schema: lo que el usuario edita (strings en los `coerce`). Admite claves extra, como el id del registro que se edita.
- Opcional: `FormSection<MisValores>[]` hace que `name` y `resetOnChange` solo acepten claves del schema.
- Para reiniciar el formulario al cambiar de registro usa `key={id}` en `<FormBuilder>`: es el patrón de React para reiniciar estado por identidad. La clave debe ser el id del registro, no un campo editable.
