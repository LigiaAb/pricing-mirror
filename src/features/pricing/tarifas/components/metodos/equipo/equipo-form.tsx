"use client";

import React from "react";

import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import { useFiltroOpciones } from "../../../hooks/use-opciones-tarifa";

export type EquipoOption = {
  value: string | number;
  label: string;

  [key: string]: unknown;
};

export type MonedaEquipoOption = {
  value: string | number;
  label: string;

  cod_moneda: string | number;

  simbolo?: string;

  [key: string]: unknown;
};

export type FilaEquipo = {
  cod_tarifa_equipo?: string | number | null;

  cod_metodo?: string | number | null;

  cod_equipo: EquipoOption | null;

  costo: string | number | null;

  venta: string | number | null;

  cod_moneda_costo: MonedaEquipoOption | null;

  cod_moneda_venta: MonedaEquipoOption | null;

  cod_estado?: string | number | null;
};

type Props = {
  value: FilaEquipo;

  equipos: EquipoOption[];
  monedas: MonedaEquipoOption[];

  readonly?: boolean;
  isPending?: boolean;

  onGuardar: (value: FilaEquipo) => void | Promise<void>;
};

export function EquipoForm({
  value,
  equipos,
  monedas,
  readonly = false,
  isPending = false,
  onGuardar,
}: Props) {
  const [values, setValues] = React.useState<FilaEquipo>(value);

  React.useEffect(() => {
    setValues(value);
  }, [value]);

  const fetchEquipos = useFiltroOpciones(equipos);

  const fetchMonedas = useFiltroOpciones(monedas);

  const ventaMenorCosto = React.useMemo(() => {
    if (
      values.costo == null ||
      values.venta == null ||
      values.costo === "" ||
      values.venta === ""
    ) {
      return false;
    }

    return Number(values.costo) > Number(values.venta);
  }, [values.costo, values.venta]);

  const puedeGuardar =
    values.cod_equipo != null &&
    values.cod_moneda_costo != null &&
    values.cod_moneda_venta != null &&
    values.costo != null &&
    values.costo !== "" &&
    values.venta != null &&
    values.venta !== "" &&
    !ventaMenorCosto;

  const esNuevo = values.cod_tarifa_equipo == null || Number(values.cod_tarifa_equipo) === 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* EQUIPO */}

        <Field>
          <FieldLabel>Equipo *</FieldLabel>

          <InputGroup>
            <div className="w-full">
              <AsyncComboboxInput<EquipoOption>
                value={values.cod_equipo}
                onChange={(cod_equipo) =>
                  setValues((prev) => ({
                    ...prev,
                    cod_equipo,
                  }))
                }
                fetchOptions={fetchEquipos}
                initialOptions={equipos}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                placeholder="Seleccione un equipo..."
                searchPlaceholder="Buscar equipo..."
                minSearchLength={0}
                fetchOnEmpty
                clearable
                readOnly={readonly}
              />
            </div>
          </InputGroup>
        </Field>

        <div />

        {/* MONEDA COSTO */}

        <Field>
          <FieldLabel>Moneda de costo *</FieldLabel>

          <InputGroup>
            <div className="w-full">
              <AsyncComboboxInput<MonedaEquipoOption>
                value={values.cod_moneda_costo}
                onChange={(cod_moneda_costo) =>
                  setValues((prev) => ({
                    ...prev,
                    cod_moneda_costo,
                  }))
                }
                fetchOptions={fetchMonedas}
                initialOptions={monedas}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                placeholder="Seleccione moneda..."
                searchPlaceholder="Buscar moneda..."
                minSearchLength={0}
                fetchOnEmpty
                clearable
                readOnly={readonly}
              />
            </div>
          </InputGroup>
        </Field>

        {/* COSTO */}

        <Field>
          <FieldLabel>
            Costo *{values.cod_moneda_costo?.simbolo ? ` (${values.cod_moneda_costo.simbolo})` : ""}
          </FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              step={0.1}
              value={values.costo ?? ""}
              readOnly={readonly}
              disabled={readonly}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,

                  costo: event.target.value === "" ? null : event.target.value,
                }))
              }
            />
          </InputGroup>
        </Field>

        {/* MONEDA VENTA */}

        <Field>
          <FieldLabel>Moneda de venta *</FieldLabel>

          <InputGroup>
            <div className="w-full">
              <AsyncComboboxInput<MonedaEquipoOption>
                value={values.cod_moneda_venta}
                onChange={(cod_moneda_venta) =>
                  setValues((prev) => ({
                    ...prev,
                    cod_moneda_venta,
                  }))
                }
                fetchOptions={fetchMonedas}
                initialOptions={monedas}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                placeholder="Seleccione moneda..."
                searchPlaceholder="Buscar moneda..."
                minSearchLength={0}
                fetchOnEmpty
                clearable
                readOnly={readonly}
              />
            </div>
          </InputGroup>
        </Field>

        {/* VENTA */}

        <Field>
          <FieldLabel>
            Venta *{values.cod_moneda_venta?.simbolo ? ` (${values.cod_moneda_venta.simbolo})` : ""}
          </FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              step={0.1}
              value={values.venta ?? ""}
              readOnly={readonly}
              disabled={readonly}
              aria-invalid={ventaMenorCosto}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,

                  venta: event.target.value === "" ? null : event.target.value,
                }))
              }
            />
          </InputGroup>

          {ventaMenorCosto && (
            <p className="text-sm text-destructive">El valor de venta debe ser mayor al de costo</p>
          )}
        </Field>
      </div>

      {!readonly && (
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!puedeGuardar || isPending}
            onClick={() => {
              void onGuardar(values);
            }}
          >
            {esNuevo ? "Agregar" : "Actualizar"}
          </Button>
        </div>
      )}
    </div>
  );
}
