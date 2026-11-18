"use client";

import * as React from "react";
import type { FieldOption, FieldRendererProps } from "../types";
import { AsyncComboboxInput } from "./async-combobox-input";

/**
 * Campo `type: "async"`: búsqueda en el servidor con el mismo contrato que
 * `select`/`catalogo` (el valor del formulario es el `value` string, `""` vacío).
 * La opción elegida se recuerda para mostrar su etiqueta aunque ya no esté en
 * los resultados; un valor inicial toma la etiqueta de `initialOptions`.
 */
function AsyncField({
  buscar,
  value,
  onChange,
  initialOptions,
  buscarQueryKey,
  minSearchLength = 0,
  placeholder,
  searchPlaceholder,
  disabled,
  readOnly,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps & { buscar: NonNullable<FieldRendererProps["buscar"]> }) {
  const [elegida, setElegida] = React.useState<FieldOption | null>(null);
  const valor = value === undefined || value === null ? "" : String(value);

  const seleccionada = React.useMemo<FieldOption | null>(() => {
    if (!valor) return null;
    if (elegida?.value === valor) return elegida;
    return initialOptions?.find((o) => o.value === valor) ?? { value: valor, label: valor };
  }, [valor, elegida, initialOptions]);

  return (
    <AsyncComboboxInput<FieldOption>
      id={id}
      ref={ref as React.Ref<HTMLButtonElement>}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      label={ariaLabel}
      value={seleccionada}
      onChange={(opcion) => {
        setElegida(opcion);
        onChange(opcion?.value ?? "");
      }}
      fetchOptions={buscar}
      {...(buscarQueryKey === undefined ? {} : { queryKey: buscarQueryKey })}
      getOptionValue={(opcion) => opcion.value}
      getOptionLabel={(opcion) => opcion.label}
      getOptionDescription={(opcion) => opcion.description}
      minSearchLength={minSearchLength}
      fetchOnEmpty={minSearchLength === 0}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(searchPlaceholder === undefined ? {} : { searchPlaceholder })}
      disabled={!!disabled}
      readOnly={!!readOnly}
    />
  );
}

export function renderAsync(props: FieldRendererProps) {
  if (!props.buscar) {
    throw new Error(`Campo '${props.name}': type "async" requiere la prop buscar`);
  }
  return <AsyncField {...props} buscar={props.buscar} />;
}
