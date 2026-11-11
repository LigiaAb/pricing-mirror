"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";
import type {
  FilaPorcentaje,
  MonedaPorcentajeOption,
  RubroPorcentajeOption,
} from "./porcentaje-columns";
import { useFiltroOpciones } from "../../../hooks/use-opciones-tarifa";
import { obtenerCantidadDecimales } from "../../../lib/tarifa-helpers";

type Props = {
  value?: FilaPorcentaje | null;

  monedas: MonedaPorcentajeOption[];
  rubros: RubroPorcentajeOption[];

  esNuevo: boolean;
  readonly?: boolean;
  isPending?: boolean;

  onGuardar: (row: FilaPorcentaje) => void;
};

export function PorcentajeForm({
  value,
  monedas,
  rubros,
  esNuevo,
  readonly = false,
  isPending = false,
  onGuardar,
}: Props) {
  const [row, setRow] = React.useState<FilaPorcentaje>(
    value ?? {
      porcentaje_costo: 0,
      porcentaje_venta: 0,
      minimo: 0,
      rubro: null,
      moneda_costo: null,
      moneda_venta: null,
    },
  );

  React.useEffect(() => {
    setRow(
      value ?? {
        porcentaje_costo: 0,
        porcentaje_venta: 0,
        minimo: 0,
        rubro: null,
        moneda_costo: null,
        moneda_venta: null,
      },
    );
  }, [value]);

  const fetchMonedas = useFiltroOpciones(monedas);

  const fetchRubros = useFiltroOpciones(rubros);

  const porcentajeCosto = Number(row.porcentaje_costo ?? 0);

  const porcentajeVenta = Number(row.porcentaje_venta ?? 0);

  const errorPorcentaje = porcentajeCosto > porcentajeVenta;

  // Se conserva exactamente la condición vieja.
  const advertenciaDecimalesCosto = obtenerCantidadDecimales(row.porcentaje_costo) > 9;

  const advertenciaDecimalesVenta = obtenerCantidadDecimales(row.porcentaje_venta) > 9;

  const porcentajeCostoFueraRango = porcentajeCosto < 0 || porcentajeCosto > 100;

  const porcentajeVentaFueraRango = porcentajeVenta < 0 || porcentajeVenta > 100;

  const puedeGuardar =
    !readonly &&
    row.moneda_costo != null &&
    row.moneda_venta != null &&
    !errorPorcentaje &&
    !porcentajeCostoFueraRango &&
    !porcentajeVentaFueraRango;

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
      {advertenciaDecimalesCosto && (
        <div className="rounded-md border p-3 text-sm">
          El porcentaje de costo no debe tener mas de 8 decimales.
        </div>
      )}

      {advertenciaDecimalesVenta && (
        <div className="rounded-md border p-3 text-sm">
          El porcentaje de valor no debe tener mas de 8 decimales.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup>
          <Field>
            <FieldLabel>Mínimo Costo</FieldLabel>

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
            <FieldLabel>Mínimo Venta</FieldLabel>

            <InputGroup>
              <InputGroupInput
                type="number"
                readOnly={readonly}
                value={row.minimo_venta ?? ""}
                onChange={(event) => setNumero("minimo_venta", event.target.value)}
              />
            </InputGroup>
          </Field>
        </FieldGroup>

        <Field>
          <FieldLabel>Moneda de costo</FieldLabel>

          <InputGroup>
            <div className="w-full">
              <AsyncComboboxInput<MonedaPorcentajeOption>
                value={row.moneda_costo ?? null}
                onChange={(moneda_costo) => setRow((prev) => ({ ...prev, moneda_costo }))}
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
            </div>
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

          {porcentajeCostoFueraRango && (
            <p className="mt-1 text-sm text-destructive">El porcentaje debe estar entre 0 y 100.</p>
          )}
        </Field>

        <Field>
          <FieldLabel>Moneda de venta</FieldLabel>

          <InputGroup>
            <div className="w-full">
              <AsyncComboboxInput<MonedaPorcentajeOption>
                value={row.moneda_venta ?? null}
                onChange={(moneda_venta) => setRow((prev) => ({ ...prev, moneda_venta }))}
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
            </div>
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

          {porcentajeVentaFueraRango && (
            <p className="mt-1 text-sm text-destructive">El porcentaje debe estar entre 0 y 100.</p>
          )}
        </Field>

        <Field>
          <FieldLabel>Rubro</FieldLabel>

          <InputGroup>
            <div className="w-full">
              <AsyncComboboxInput<RubroPorcentajeOption>
                value={row.rubro ?? null}
                onChange={(rubro) => setRow((prev) => ({ ...prev, rubro }))}
                fetchOptions={fetchRubros}
                initialOptions={rubros}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                placeholder="Seleccione..."
                searchPlaceholder="Buscar rubro..."
                minSearchLength={0}
                fetchOnEmpty
                clearable
                readOnly={readonly}
              />
            </div>
          </InputGroup>
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
