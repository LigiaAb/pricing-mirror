"use client";

import type React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";
import { type MonedaOpcion, useFiltroOpciones } from "../../hooks/use-opciones-tarifa";
import type { DefCampo } from "../../lib/campos-metodo";

/* ==========================================================================
 * CAMPO DE UN MÉTODO DE TARIFA
 *
 * Dibuja un campo (etiqueta + input) a partir de su definición en
 * lib/metodos/<metodo>.ts. El layout (grilla, orden, mensajes) lo decide el
 * formulario de cada método:
 *
 *   const campo = { metodo: METODO_X, fila: row, onChange: cambiar, monedas, readonly };
 *   <CampoMetodo {...campo} campo="costo" />
 *   <CampoMetodo {...campo} campo="venta">{mensajeDeError}</CampoMetodo>
 *
 * Los campos con un input distinto (radio, selects en cascada, ...) se
 * escriben a mano en el formulario.
 * ========================================================================== */

const SIN_MONEDAS: MonedaOpcion[] = [];

type Props<C extends Record<string, DefCampo>, F extends object> = {
  metodo: { campos: C };
  campo: keyof C & string;
  fila: F;
  onChange: (cambio: Partial<F>) => void;
  monedas?: MonedaOpcion[] | undefined;
  readonly?: boolean | undefined;
  /** Contenido extra debajo del input (ej. mensaje de error). */
  children?: React.ReactNode;
};

export function CampoMetodo<C extends Record<string, DefCampo>, F extends object>({
  metodo,
  campo,
  fila,
  onChange,
  monedas = SIN_MONEDAS,
  readonly = false,
  children,
}: Props<C, F>) {
  const def = metodo.campos[campo] as DefCampo;
  const valores = fila as Record<string, unknown>;

  const fetchMonedas = useFiltroOpciones(monedas);

  const cambiar = (clave: string, valor: unknown) => onChange({ [clave]: valor } as Partial<F>);

  if (def.tipo === "moneda" && def.en) {
    const en = def.en;

    return (
      <Field>
        <FieldLabel>{def.label}</FieldLabel>

        <InputGroup>
          <AsyncComboboxInput<MonedaOpcion>
            label={def.label}
            value={(valores[en] as MonedaOpcion | null | undefined) ?? null}
            onChange={(opcion: MonedaOpcion | null) => cambiar(en, opcion)}
            fetchOptions={fetchMonedas}
            initialOptions={monedas}
            getOptionValue={(option: MonedaOpcion) => option.value}
            getOptionLabel={(option: MonedaOpcion) => option.label}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar moneda..."
            minSearchLength={0}
            fetchOnEmpty
            clearable
            readOnly={readonly}
          />
        </InputGroup>

        {children}
      </Field>
    );
  }

  if (def.tipo === "monto") {
    const { min, max, step, simboloDe, sufijo } = def.formulario ?? {};
    const addon =
      sufijo ??
      (simboloDe == null
        ? undefined
        : (valores[simboloDe] as MonedaOpcion | null | undefined)?.simbolo);

    return (
      <Field>
        <FieldLabel>{def.label}</FieldLabel>

        <InputGroup>
          <InputGroupInput
            type="number"
            {...(min == null ? {} : { min })}
            {...(max == null ? {} : { max })}
            {...(step == null ? {} : { step })}
            readOnly={readonly}
            value={(valores[campo] as string | number | null | undefined) ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              cambiar(campo, event.target.value === "" ? null : Number(event.target.value))
            }
          />

          {addon && <InputGroupAddon align="inline-end">{addon}</InputGroupAddon>}
        </InputGroup>

        {children}
      </Field>
    );
  }

  // fijo / contexto: no se ven en el formulario.
  return null;
}
