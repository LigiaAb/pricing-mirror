"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import { crearIdLocal } from "@/shared/lib/id";

import type { FilaMetodoRango, MonedaRangoOption } from "./rango-columns";
import { useFiltroOpciones } from "../../../hooks/use-opciones-tarifa";

type Props = {
  value?: FilaMetodoRango | null;
  monedas: MonedaRangoOption[];

  onGuardar: (row: FilaMetodoRango) => void;
  onCancelar?: () => void;

  readonly?: boolean;
};

export function RangoForm({ value, monedas, onGuardar, onCancelar, readonly = false }: Props) {
  const [row, setRow] = React.useState<FilaMetodoRango | null>(value ?? null);

  React.useEffect(() => {
    setRow(value ?? null);
  }, [value]);

  const fetchMonedas = useFiltroOpciones(monedas);

  const iniciarNuevo = () => {
    setRow({
      localId: crearIdLocal(),
      inicio: "",
      costo_minimo: "",
      venta_minimo: "",
      costo: "",
      venta: "",
      moneda_costo: null,
      moneda_venta: null,
    });
  };

  if (readonly) return null;

  if (!row) {
    return (
      <Button type="button" onClick={iniciarNuevo}>
        <Plus className="size-4" />
        Agregar
      </Button>
    );
  }

  const esEdicion = Boolean(value);

  const errores = (() => {
    const lista: string[] = [];

    if (!row.costo_minimo) lista.push("Mínimo de Costo");
    if (!row.venta_minimo) lista.push("Mínimo de Venta");
    if (!row.costo) lista.push("Costo");
    if (!row.venta) lista.push("Venta");
    if (!row.moneda_costo) lista.push("Moneda de Costo");
    if (!row.moneda_venta) lista.push("Moneda de Venta");

    if (row.costo && row.venta && Number(row.costo) > Number(row.venta)) {
      lista.push("El valor de venta debe ser igual o mayor al valor del costo");
    }

    return lista;
  })();

  const setNumero = (
    field: "inicio" | "costo_minimo" | "venta_minimo" | "costo" | "venta",
    value: string,
  ) => {
    setRow((prev) =>
      prev
        ? {
            ...prev,
            [field]: value === "" ? "" : Number(value),
          }
        : prev,
    );
  };

  return (
    <div className="space-y-2">
      <div className="grid items-end gap-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-7">
        <Field>
          <FieldLabel>A partir de...</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type="number"
              value={row.inicio ?? ""}
              onChange={(e) => setNumero("inicio", e.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Mínimo costo</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type="number"
              value={row.costo_minimo ?? ""}
              onChange={(e) => setNumero("costo_minimo", e.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Mínimo venta</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type="number"
              value={row.venta_minimo ?? ""}
              onChange={(e) => setNumero("venta_minimo", e.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Costo</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type="number"
              value={row.costo ?? ""}
              onChange={(e) => setNumero("costo", e.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Moneda costo</FieldLabel>
          <InputGroup>
            <AsyncComboboxInput<MonedaRangoOption>
              label="Moneda costo"
              value={row.moneda_costo ?? null}
              onChange={(moneda_costo) =>
                setRow((prev) =>
                  prev
                    ? {
                        ...prev,
                        moneda_costo,
                      }
                    : prev,
                )
              }
              fetchOptions={fetchMonedas}
              initialOptions={monedas}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              minSearchLength={0}
              fetchOnEmpty
              clearable
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Venta</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type="number"
              value={row.venta ?? ""}
              onChange={(e) => setNumero("venta", e.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Moneda venta</FieldLabel>
          <InputGroup>
            <AsyncComboboxInput<MonedaRangoOption>
              label="Moneda venta"
              value={row.moneda_venta ?? null}
              onChange={(moneda_venta) =>
                setRow((prev) =>
                  prev
                    ? {
                        ...prev,
                        moneda_venta,
                      }
                    : prev,
                )
              }
              fetchOptions={fetchMonedas}
              initialOptions={monedas}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              minSearchLength={0}
              fetchOnEmpty
              clearable
            />
          </InputGroup>
        </Field>
      </div>

      {errores.length > 0 && <p className="text-sm text-destructive">{errores.join(", ")}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={errores.length > 0}
          onClick={() => {
            onGuardar(row);
            setRow(null);
          }}
        >
          {esEdicion ? <Save className="size-4" /> : <Plus className="size-4" />}

          {esEdicion ? "Aplicar" : "Agregar"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setRow(null);
            onCancelar?.();
          }}
        >
          <X className="size-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
