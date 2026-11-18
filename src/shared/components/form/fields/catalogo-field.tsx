"use client";

import * as React from "react";
import { asText, normalizarBusqueda } from "@/shared/lib/text";
import type { FieldOption, FieldRendererProps } from "../types";
import { renderCombobox } from "./basic-fields";

/**
 * Adapta un hook de catálogo (`paises.useLista`, …) a `FieldCatalogo`:
 *
 * ```ts
 * const opcionesPais = catalogoOpciones(
 *   () => paises.useLista(),
 *   (p) => ({ value: String(p.cod_pais), label: p.nombre_pais }),
 * );
 * ```
 *
 * Declarar el resultado a nivel de módulo: el hook se invoca dentro del campo.
 */
export function catalogoOpciones<T>(
  useLista: () => { data?: readonly T[] | undefined; isLoading: boolean },
  aOpcion: (item: T) => FieldOption,
) {
  return () => {
    const { data, isLoading } = useLista();
    return { options: (data ?? []).map(aOpcion), isLoading };
  };
}

const normalizar = (texto: string) => normalizarBusqueda(texto).trim();

/**
 * Valor del campo contra las opciones: acepta el `value` exacto o, para datos
 * guardados por nombre, la etiqueta (sin acentos ni mayúsculas).
 */
function buscarOpcion(options: FieldOption[], valor: string): FieldOption | undefined {
  if (!valor) return undefined;
  return (
    options.find((o) => o.value === valor) ??
    options.find((o) => normalizar(o.label) === normalizar(valor))
  );
}

function CatalogoField({
  catalogo,
  ...props
}: FieldRendererProps & { catalogo: NonNullable<FieldRendererProps["catalogo"]> }) {
  const { options: opcionesCatalogo, isLoading } = catalogo();
  const { value, onChange, fixedValue, disabled, readOnly } = props;
  const bloqueado = !!disabled || !!readOnly;

  const fija = fixedValue ? buscarOpcion(opcionesCatalogo, fixedValue) : undefined;
  const actual = buscarOpcion(opcionesCatalogo, asText(value));
  const valorFijado = fija && !bloqueado ? fija.value : undefined;
  const valorMostrado = valorFijado ?? actual?.value ?? asText(value);

  // Un valor que el catálogo no trae (registro viejo, opción inactiva) se sigue mostrando.
  const options = React.useMemo(
    () =>
      valorMostrado && !opcionesCatalogo.some((o) => o.value === valorMostrado)
        ? [...opcionesCatalogo, { value: valorMostrado, label: valorMostrado }]
        : opcionesCatalogo,
    [opcionesCatalogo, valorMostrado],
  );

  // El valor fijo depende del catálogo, así que se escribe en el formulario al
  // llegar la lista. Un campo deshabilitado por el formulario (modo revisar)
  // conserva el valor del registro.
  React.useEffect(() => {
    if (valorFijado !== undefined && asText(value) !== valorFijado) onChange(valorFijado);
  }, [valorFijado, value, onChange]);

  return renderCombobox({
    ...props,
    value: valorMostrado,
    options,
    disabled: bloqueado || !!fija || isLoading,
    isLoading,
  });
}

export function renderCatalogo(props: FieldRendererProps) {
  if (!props.catalogo) {
    throw new Error(`Campo '${props.name}': type "catalogo" requiere la prop catalogo`);
  }
  return <CatalogoField {...props} catalogo={props.catalogo} />;
}
