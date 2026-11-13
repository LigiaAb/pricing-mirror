"use client";

import type React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";
import {
  type MonedaOpcion,
  type RubroOpcion,
  useFiltroOpciones,
} from "../../hooks/use-opciones-tarifa";
import type { DefCampo } from "../../lib/campos-metodo";

/* ==========================================================================
 * CAMPO DE UN MÉTODO DE TARIFA
 *
 * Dibuja un campo (etiqueta + input + sus errores) a partir de su definición
 * en lib/metodos/<metodo>.ts. El layout (grilla, orden) lo decide el
 * formulario de cada método:
 *
 *   const { errores } = METODO_X.validar(row);
 *   const campo = { metodo: METODO_X, fila: row, onChange: cambiar, monedas, readonly, errores };
 *   <CampoMetodo {...campo} campo="costo" />
 *
 * Los campos con un input distinto (radio, selects en cascada, ...) se
 * escriben a mano en el formulario.
 * ========================================================================== */

const SIN_MONEDAS: MonedaOpcion[] = [];
const SIN_RUBROS: RubroOpcion[] = [];

type Opcion = { value: string; label: string };

type Props<C extends Record<string, DefCampo>, F extends object> = {
  metodo: { campos: C };
  campo: keyof C & string;
  fila: F;
  onChange: (cambio: Partial<F>) => void;
  monedas?: MonedaOpcion[] | undefined;
  rubros?: RubroOpcion[] | undefined;
  readonly?: boolean | undefined;
  /** Resultado de METODO_X.validar(fila).errores: se muestran los de este campo. */
  errores?: Partial<Record<string, string[]>> | undefined;
  /**
   * Selects: estilo de los formularios que envuelven el combo en
   * <div className="w-full"> y no le pasan `label` (ej. porcentaje).
   */
  comboEnvuelto?: boolean | undefined;
  /** Contenido extra al final del campo. */
  children?: React.ReactNode;
};

export function CampoMetodo<C extends Record<string, DefCampo>, F extends object>({
  metodo,
  campo,
  fila,
  onChange,
  monedas = SIN_MONEDAS,
  rubros = SIN_RUBROS,
  readonly = false,
  errores,
  comboEnvuelto = false,
  children,
}: Props<C, F>) {
  const def = metodo.campos[campo] as DefCampo;
  const valores = fila as Record<string, unknown>;

  const fetchMonedas = useFiltroOpciones(monedas);
  const fetchRubros = useFiltroOpciones(rubros);

  const cambiar = (clave: string, valor: unknown) => onChange({ [clave]: valor } as Partial<F>);

  const mensajes = errores?.[campo]?.map((mensaje, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: lista fija de mensajes de las reglas.
    <p key={i} className="mt-1 text-sm text-destructive">
      {mensaje}
    </p>
  ));

  if ((def.tipo === "moneda" || def.tipo === "rubro") && def.en) {
    const en = def.en;
    const esMoneda = def.tipo === "moneda";
    const opciones: Opcion[] = esMoneda ? monedas : rubros;

    const combo = (
      <AsyncComboboxInput<Opcion>
        {...(comboEnvuelto ? {} : { label: def.label })}
        value={(valores[en] as Opcion | null | undefined) ?? null}
        onChange={(opcion: Opcion | null) => cambiar(en, opcion)}
        fetchOptions={esMoneda ? fetchMonedas : fetchRubros}
        initialOptions={opciones}
        getOptionValue={(option: Opcion) => option.value}
        getOptionLabel={(option: Opcion) => option.label}
        placeholder="Seleccione..."
        searchPlaceholder={esMoneda ? "Buscar moneda..." : "Buscar rubro..."}
        minSearchLength={0}
        fetchOnEmpty
        clearable
        readOnly={readonly}
      />
    );

    return (
      <Field>
        <FieldLabel>{def.label}</FieldLabel>

        <InputGroup>{comboEnvuelto ? <div className="w-full">{combo}</div> : combo}</InputGroup>

        {mensajes}

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

        {mensajes}

        {children}
      </Field>
    );
  }

  // fijo / contexto: no se ven en el formulario.
  return null;
}
