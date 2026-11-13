"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { useFiltroOpciones } from "../../../hooks/use-opciones-tarifa";
import { obtenerCantidadDecimales } from "../../../lib/tarifa-helpers";
import type {
  FilaPorcentaje,
  MonedaPorcentajeOption,
  RubroPorcentajeOption,
} from "./porcentaje-columns";

type Props = {
  value?: FilaPorcentaje | null;

  monedas: MonedaPorcentajeOption[];
  rubros: RubroPorcentajeOption[];

  esNuevo: boolean;
  readonly?: boolean;
  isPending?: boolean;

  onGuardar: (row: FilaPorcentaje) => void;
};

export function CostoPorcentajeForm({
  value,
  monedas,
  esNuevo,
  readonly = false,
  isPending = false,
  onGuardar,
}: Props) {
  const [row, setRow] = React.useState<FilaPorcentaje>(
    value ?? {
      porcentaje_costo: 0,
      porcentaje_venta: 0,
      minimo_costo: 0,
      minimo_venta: 0,
      moneda_costo: null,
      moneda_venta: null,
      es_porcentaje: true,
    },
  );

  React.useEffect(() => {
    setRow(
      value ?? {
        porcentaje_costo: 0,
        porcentaje_venta: 0,
        minimo_costo: 0,
        minimo_venta: 0,
        moneda_costo: null,
        moneda_venta: null,
        es_porcentaje: true,
      },
    );
  }, [value]);

  const fetchMonedas = useFiltroOpciones(monedas);

  // const fetchRubros = React.useCallback(
  //   async (search: string): Promise<RubroPorcentajeOption[]> => {
  //     const busqueda = search.trim().toLowerCase();

  //     if (!busqueda) return rubros;

  //     return rubros.filter((rubro) => rubro.label.toLowerCase().includes(busqueda));
  //   },
  //   [rubros],
  // );

  const porcentajeCosto = Number(row.porcentaje_costo ?? 0);

  const porcentajeVenta = Number(row.porcentaje_venta ?? 0);

  const errorPorcentaje = porcentajeCosto > porcentajeVenta;

  // Se conserva exactamente la condición vieja.
  const advertenciaDecimalesCosto = obtenerCantidadDecimales(row.porcentaje_costo) > 9;

  const advertenciaDecimalesVenta = obtenerCantidadDecimales(row.porcentaje_venta) > 9;

  // Si es porcentaje se guarda en enteros con decimales (25.26 = 25.26 %), no como 0.2526.
  // Cotizaciones lo convierte a factor (÷ 100) al calcular la venta.
  const fueraDeRango = (valor: number) => valor < 0 || (Boolean(row.es_porcentaje) && valor > 100);

  const porcentajeCostoFueraRango = fueraDeRango(porcentajeCosto);

  const porcentajeVentaFueraRango = fueraDeRango(porcentajeVenta);

  const puedeGuardar =
    !readonly &&
    row.moneda_venta != null &&
    !errorPorcentaje &&
    !porcentajeCostoFueraRango &&
    !porcentajeVentaFueraRango;

  const setNumero = (field: "minimo_venta" | "porcentaje_venta", value: string) => {
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
        {/* <Field>
          <FieldLabel>Costo Mínimo</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              readOnly={readonly}
              value={row.minimo_costo ?? ""}
              onChange={(event) => setRow((row) => ({ ...row, minimo_costo: event.target.value }))}
            />
          </InputGroup>
        </Field> */}

        <Field>
          <FieldLabel>Mínimo Venta</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              readOnly={readonly}
              value={row.minimo_venta ?? ""}
              onChange={(event) => setRow((row) => ({ ...row, minimo_venta: event.target.value }))}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>{row.es_porcentaje ? "Porcentaje venta" : "Valor venta"}</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              min={0}
              {...(row.es_porcentaje ? { max: 100 } : {})}
              step={row.es_porcentaje ? 0.01 : 1}
              readOnly={readonly}
              value={row.porcentaje_venta ?? ""}
              onChange={(event) => setNumero("porcentaje_venta", event.target.value)}
            />

            {row.es_porcentaje && <InputGroupAddon align="inline-end">%</InputGroupAddon>}
          </InputGroup>

          {row.es_porcentaje && (
            <p className="mt-1 text-xs text-muted-foreground">
              Ingrese el porcentaje en enteros con decimales (ej. 25.26 para 25.26 %).
            </p>
          )}

          {errorPorcentaje && (
            <p className="mt-1 text-sm text-destructive">
              El valor de venta debe ser mayor al de costo
            </p>
          )}

          {porcentajeVentaFueraRango && (
            <p className="mt-1 text-sm text-destructive">
              {row.es_porcentaje
                ? "El porcentaje debe estar entre 0 y 100."
                : "El valor no puede ser negativo."}
            </p>
          )}
        </Field>

        {/* <Field>
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
        </Field> */}

        {/* <Field>
          <FieldLabel>Porcentaje costo</FieldLabel>

          <InputGroup>
            <InputGroupInput
              type="number"
              min={0}
              max={100}
              step={row.es_porcentaje ? 0.01 : 1}
              readOnly={readonly}
              value={row.porcentaje_costo ?? ""}
              onChange={(event) => setNumero("porcentaje_costo", event.target.value)}
            />

            <InputGroupAddon align="inline-end">%</InputGroupAddon>
          </InputGroup>

          {porcentajeCostoFueraRango && (
            <p className="mt-1 text-sm text-destructive">El porcentaje debe estar entre 0 y 100.</p>
          )}
        </Field> */}

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
          <FieldLabel>Tipo de valor</FieldLabel>

          <InputGroup className="flex p-2">
            <RadioGroup
              value={row.es_porcentaje ? "porcentaje" : "valor"}
              onValueChange={(value) =>
                setRow((prev) => ({ ...prev, es_porcentaje: value === "porcentaje" }))
              }
              className="flex flex-row gap-2"
              disabled={readonly}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="porcentaje" id={`porcentaje`} />
                <Label htmlFor={`porcentaje`}>Porcentaje</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="valor" id={`valor`} />
                <Label htmlFor={`valor`}>Valor</Label>
              </div>
            </RadioGroup>
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
