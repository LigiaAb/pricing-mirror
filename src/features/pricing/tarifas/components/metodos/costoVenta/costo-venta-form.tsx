"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";

import type { FilaCostoVenta, MonedaCostoVentaOption } from "./costo-venta-columns";
import { useFiltroOpciones } from "../../../hooks/use-opciones-tarifa";

type Props = {
  value?: FilaCostoVenta | null;
  monedas: MonedaCostoVentaOption[];

  esNuevo: boolean;
  readonly?: boolean;
  isPending?: boolean;

  onGuardar: (row: FilaCostoVenta) => void;
};

export function CostoVentaForm({
  value,
  monedas,
  esNuevo,
  readonly = false,
  isPending = false,
  onGuardar,
}: Props) {
  const [row, setRow] = React.useState<FilaCostoVenta>(value ?? {});

  React.useEffect(() => {
    setRow(value ?? {});
  }, [value]);

  const fetchMonedas = useFiltroOpciones(monedas);

  const faltaCosto = row.costo == null || row.costo === "";

  const faltaVenta = row.venta == null || row.venta === "";

  const errorVenta = !faltaCosto && !faltaVenta && Number(row.costo) > Number(row.venta);

  const puedeGuardar =
    !readonly &&
    !faltaCosto &&
    !faltaVenta &&
    Boolean(row.moneda_costo) &&
    Boolean(row.moneda_venta) &&
    !errorVenta;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>Moneda de costo</FieldLabel>

          <InputGroup>
            <AsyncComboboxInput<MonedaCostoVentaOption>
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
          <FieldLabel>Costo</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              step="0.1"
              readOnly={readonly}
              value={row.costo ?? ""}
              onChange={(event) =>
                setRow((prev) => ({
                  ...prev,
                  costo: event.target.value === "" ? null : Number(event.target.value),
                }))
              }
            />

            {row.moneda_costo?.simbolo && (
              <InputGroupAddon align="inline-end">{row.moneda_costo.simbolo}</InputGroupAddon>
            )}
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Moneda de venta</FieldLabel>

          <InputGroup>
            <AsyncComboboxInput<MonedaCostoVentaOption>
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
          <FieldLabel>Venta</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              step="0.1"
              readOnly={readonly}
              value={row.venta ?? ""}
              onChange={(event) =>
                setRow((prev) => ({
                  ...prev,
                  venta: event.target.value === "" ? null : Number(event.target.value),
                }))
              }
            />

            {row.moneda_venta?.simbolo && (
              <InputGroupAddon align="inline-end">{row.moneda_venta.simbolo}</InputGroupAddon>
            )}
          </InputGroup>

          {errorVenta && (
            <p className="mt-1 text-sm text-destructive">
              El valor de venta debe ser mayor o igual al valor de costo.
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
