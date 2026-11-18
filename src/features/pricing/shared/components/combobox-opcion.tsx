"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import { cn } from "@/shared/lib/utils";

/* ==========================================================================
 * COMBOBOX CON VALOR OBJETO (opciones en memoria)
 *
 * `Combobox` (@/shared/components/ui/combobox) es el select buscable para
 * datos en memoria, pero su valor es un `string`. Los formularios de Tarifas y
 * Cotizaciones guardan la opción completa ({ value, label, cod_moneda, ... })
 * y de ella sacan el payload. Este adaptador convierte en ambos sentidos para
 * que el estado y los payloads no cambien.
 *
 *   <ComboboxOpcion value={fila.moneda} onChange={(moneda) => ...} options={monedas} />
 *
 * - Cuadro de búsqueda: lo trae `Combobox` (filtra por label y value, sin tildes).
 * - Limpiar: "x" al final y, como en `AsyncComboboxInput`, elegir de nuevo la
 *   opción seleccionada (`clearable`, por defecto true).
 * - `value` numérico (ej. monedas de equipo): se compara como texto y se
 *   devuelve la opción original, con su `value` numérico.
 * - Si el valor guardado no está en las opciones, se agrega a la lista para
 *   que se vea su nombre (antes `AsyncComboboxInput` mostraba su label).
 *
 * Búsqueda en el servidor (clientes, entidades): seguir con `AsyncComboboxInput`.
 * ========================================================================== */

type Id = string | number;

/** Lo mínimo que necesita una opción; el resto de campos se conserva. */
export type OpcionComboboxBase = {
  value?: Id | null | undefined;
  label?: string | number | null | undefined;
};

/** Clave de texto de una opción; las de `value` nulo comparten una clave propia. */
const VALOR_NULO = "__NULL_OPTION__";

const claveDe = (value: Id | null | undefined) => (value == null ? VALOR_NULO : String(value));

const aOpcionCombobox = (opcion: OpcionComboboxBase): ComboboxOption => ({
  value: claveDe(opcion.value),
  label: String(opcion.label ?? ""),
});

export type ComboboxOpcionProps<T extends OpcionComboboxBase> = {
  id?: string | undefined;
  /** Nombre accesible del campo (y del botón "Limpiar ..."). */
  label?: string | undefined;
  value: T | null | undefined;
  onChange: (opcion: T | null) => void;
  options: readonly T[];
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptyMessage?: string | undefined;
  disabled?: boolean | undefined;
  clearable?: boolean | undefined;
  className?: string | undefined;
  popoverClassName?: string | undefined;
  /** `false` dentro de un diálogo modal (ver `Combobox`). */
  portalled?: boolean | undefined;
};

export function ComboboxOpcion<T extends OpcionComboboxBase>({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccione...",
  searchPlaceholder = "Buscar...",
  emptyMessage,
  disabled = false,
  clearable = true,
  className,
  popoverClassName,
  portalled,
}: ComboboxOpcionProps<T>) {
  const seleccion = value == null ? "" : claveDe(value.value);

  const opciones = React.useMemo(() => {
    const lista = options.map(aOpcionCombobox);

    if (value == null || options.some((opcion) => claveDe(opcion.value) === seleccion)) {
      return lista;
    }

    return [aOpcionCombobox(value), ...lista];
  }, [options, value, seleccion]);

  const puedeLimpiar = clearable && value != null && !disabled;

  const cambiar = (clave: string) => {
    if (clave === "") {
      onChange(null);
      return;
    }

    if (value != null && clave === seleccion) {
      onChange(value);
      return;
    }

    onChange(options.find((opcion) => claveDe(opcion.value) === clave) ?? null);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Combobox
        id={id}
        value={seleccion}
        onChange={cambiar}
        options={opciones}
        ariaLabel={label}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        disabled={disabled}
        clearable={clearable}
        className={puedeLimpiar ? "pr-16" : undefined}
        popoverClassName={popoverClassName}
        portalled={portalled}
      />

      {puedeLimpiar ? (
        <button
          type="button"
          aria-label={label ? `Limpiar ${label}` : "Limpiar selección"}
          title="Limpiar"
          tabIndex={-1}
          className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange(null);
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
