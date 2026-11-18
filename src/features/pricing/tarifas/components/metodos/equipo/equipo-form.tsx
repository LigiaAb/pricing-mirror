"use client";

import React from "react";

import { ComboboxOpcion } from "@/features/pricing/shared";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import {
  type EquipoOption,
  type FilaEquipo,
  METODO_EQUIPO,
  type MonedaEquipoOption,
} from "../../../lib/metodos/equipo";

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

  // Requeridos (equipo, monedas, costo, venta) y venta >= costo: ver lib/metodos/equipo.ts.
  const { valido: puedeGuardar, errores } = METODO_EQUIPO.validar(values);

  const ventaMenorCosto = errores.venta != null;

  const esNuevo = values.cod_tarifa_equipo == null || Number(values.cod_tarifa_equipo) === 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* EQUIPO */}

        <Field>
          <FieldLabel>Equipo *</FieldLabel>

          <InputGroup>
            <div className="w-full">
              <ComboboxOpcion<EquipoOption>
                value={values.cod_equipo ?? null}
                onChange={(cod_equipo) =>
                  setValues((prev) => ({
                    ...prev,
                    cod_equipo,
                  }))
                }
                options={equipos}
                placeholder="Seleccione un equipo..."
                searchPlaceholder="Buscar equipo..."
                disabled={readonly}
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
              <ComboboxOpcion<MonedaEquipoOption>
                value={values.cod_moneda_costo ?? null}
                onChange={(cod_moneda_costo) =>
                  setValues((prev) => ({
                    ...prev,
                    cod_moneda_costo,
                  }))
                }
                options={monedas}
                placeholder="Seleccione moneda..."
                searchPlaceholder="Buscar moneda..."
                disabled={readonly}
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
              <ComboboxOpcion<MonedaEquipoOption>
                value={values.cod_moneda_venta ?? null}
                onChange={(cod_moneda_venta) =>
                  setValues((prev) => ({
                    ...prev,
                    cod_moneda_venta,
                  }))
                }
                options={monedas}
                placeholder="Seleccione moneda..."
                searchPlaceholder="Buscar moneda..."
                disabled={readonly}
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
