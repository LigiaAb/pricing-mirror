"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";

import type { FilaCobertura, MonedaCoberturaOption } from "./cobertura-columns";
import { useFiltroOpciones } from "../../../hooks/use-opciones-tarifa";
import { obtenerCantidadDecimales } from "../../../lib/tarifa-helpers";

type Props = {
  value?: FilaCobertura | null;
  monedas: MonedaCoberturaOption[];

  esNuevo: boolean;
  readonly?: boolean;
  isPending?: boolean;

  onGuardar: (row: FilaCobertura) => void;
};

export function CoberturaForm({
  value,
  monedas,
  esNuevo,
  readonly = false,
  isPending = false,
  onGuardar,
}: Props) {
  const [row, setRow] = React.useState<FilaCobertura>(
    value ?? {
      porcentaje_costo: 0,
      porcentaje_venta: 0,
      minimo_costo: 0,
      minimo_venta: 0,
    },
  );

  React.useEffect(() => {
    setRow(
      value ?? {
        porcentaje_costo: 0,
        porcentaje_venta: 0,
        minimo_costo: 0,
        minimo_venta: 0,
      },
    );
  }, [value]);

  const fetchMonedas = useFiltroOpciones(monedas);

  const porcentajeCosto = Number(row.porcentaje_costo ?? 0);

  const porcentajeVenta = Number(row.porcentaje_venta ?? 0);

  const errorPorcentaje = porcentajeCosto > porcentajeVenta;

  /*
   * Se conserva la condición del código viejo:
   * > 9.
   *
   * Aunque el mensaje dice "más de 8 decimales".
   */
  const errorDecimalesCosto = obtenerCantidadDecimales(row.porcentaje_costo) > 9;

  const errorDecimalesVenta = obtenerCantidadDecimales(row.porcentaje_venta) > 9;

  const puedeGuardar =
    !readonly && row.moneda_costo != null && row.moneda_venta != null && !errorPorcentaje;

  const setNumero = (
    field: "minimo_costo" | "minimo_venta" | "porcentaje_costo" | "porcentaje_venta",
    value: string,
  ) => {
    setRow((prev) => ({
      ...prev,
      [field]: value === "" ? null : Number(value),
    }));
  };

  return (
    <div className="space-y-4">
      {errorDecimalesCosto && (
        <div className="rounded-md border p-3 text-sm">
          El porcentaje de costo no debe tener mas de 8 decimales.
        </div>
      )}

      {errorDecimalesVenta && (
        <div className="rounded-md border p-3 text-sm">
          El porcentaje de valor no debe tener mas de 8 decimales.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>Mínimo costo</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              readOnly={readonly}
              value={row.minimo_costo ?? ""}
              onChange={(event) => setNumero("minimo_costo", event.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Mínimo venta</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              readOnly={readonly}
              value={row.minimo_venta ?? ""}
              onChange={(event) => setNumero("minimo_venta", event.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Moneda de costo</FieldLabel>

          <InputGroup>
            <AsyncComboboxInput<MonedaCoberturaOption>
              label="Moneda de costo"
              value={row.moneda_costo ?? null}
              onChange={(moneda_costo) =>
                setRow((prev) => ({
                  ...prev,
                  moneda_costo,
                }))
              }
              fetchOptions={fetchMonedas}
              initialOptions={monedas}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar moneda..."
              minSearchLength={0}
              fetchOnEmpty
              clearable
              readOnly={readonly}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Porcentaje costo</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              min={0}
              max={100}
              step="0.01"
              readOnly={readonly}
              value={row.porcentaje_costo ?? ""}
              onChange={(event) => setNumero("porcentaje_costo", event.target.value)}
            />

            <InputGroupAddon align="inline-end">%</InputGroupAddon>
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Moneda de venta</FieldLabel>

          <InputGroup>
            <AsyncComboboxInput<MonedaCoberturaOption>
              label="Moneda de venta"
              value={row.moneda_venta ?? null}
              onChange={(moneda_venta) =>
                setRow((prev) => ({
                  ...prev,
                  moneda_venta,
                }))
              }
              fetchOptions={fetchMonedas}
              initialOptions={monedas}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar moneda..."
              minSearchLength={0}
              fetchOnEmpty
              clearable
              readOnly={readonly}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Porcentaje venta</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              min={0}
              max={100}
              step="0.01"
              readOnly={readonly}
              value={row.porcentaje_venta ?? ""}
              onChange={(event) => setNumero("porcentaje_venta", event.target.value)}
            />

            <InputGroupAddon align="inline-end">%</InputGroupAddon>
          </InputGroup>

          {errorPorcentaje && (
            <p className="mt-1 text-sm text-destructive">
              El valor de venta debe ser mayor al de costo
            </p>
          )}
        </Field>
      </div>

      {!readonly && (
        <Button type="button" disabled={!puedeGuardar || isPending} onClick={() => onGuardar(row)}>
          {esNuevo ? <Plus className="size-4" /> : <Save className="size-4" />}

          {esNuevo ? "Agregar" : "Actualizar"}
        </Button>
      )}
    </div>
  );
}
