"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import {
  type FilaCostoPorcentaje,
  METODO_COSTO_PORCENTAJE,
  type MonedaCostoPorcentajeOption,
  type RubroCostoPorcentajeOption,
} from "../../../lib/metodos/costo-porcentaje";
import { obtenerCantidadDecimales } from "../../../lib/tarifa-helpers";
import { CampoMetodo } from "../campo-metodo";

type Props = {
  value?: FilaCostoPorcentaje | null;

  monedas: MonedaCostoPorcentajeOption[];
  rubros: RubroCostoPorcentajeOption[];

  esNuevo: boolean;
  readonly?: boolean;
  isPending?: boolean;

  onGuardar: (row: FilaCostoPorcentaje) => void;
};

export function CostoPorcentajeForm({
  value,
  monedas,
  esNuevo,
  readonly = false,
  isPending = false,
  onGuardar,
}: Props) {
  // Nuevo: montos en 0, monedas vacías y es_porcentaje (`inicial` en lib/metodos/costo-porcentaje.ts).
  const [row, setRow] = React.useState<FilaCostoPorcentaje>(
    value ?? METODO_COSTO_PORCENTAJE.filaNueva(),
  );

  React.useEffect(() => {
    setRow(value ?? METODO_COSTO_PORCENTAJE.filaNueva());
  }, [value]);

  const cambiar = React.useCallback((cambio: Partial<FilaCostoPorcentaje>) => {
    setRow((prev) => ({ ...prev, ...cambio }));
  }, []);

  // Moneda de venta requerida, venta >= costo y rango según es_porcentaje: ver la definición.
  const { valido, errores } = METODO_COSTO_PORCENTAJE.validar(row);

  // Se conserva exactamente la condición vieja.
  const advertenciaDecimalesCosto = obtenerCantidadDecimales(row.porcentaje_costo) > 9;

  const advertenciaDecimalesVenta = obtenerCantidadDecimales(row.porcentaje_venta) > 9;

  const puedeGuardar = !readonly && valido;

  const campo = {
    metodo: METODO_COSTO_PORCENTAJE,
    fila: row,
    onChange: cambiar,
    monedas,
    readonly,
    errores,
    comboEnvuelto: true,
  };

  /*
   * El lado de costo (cod_moneda_costo, porcentaje_costo, minimo_costo) está
   * definido pero oculto. Para mostrarlo: <CampoMetodo {...campo} campo="..." />.
   */
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
        <CampoMetodo {...campo} campo="minimo_venta" />

        {/* A mano: etiqueta, max, step y "%" cambian con es_porcentaje. */}
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
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                cambiar({
                  porcentaje_venta: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />

            {row.es_porcentaje && <InputGroupAddon align="inline-end">%</InputGroupAddon>}
          </InputGroup>

          {row.es_porcentaje && (
            <p className="mt-1 text-xs text-muted-foreground">
              Ingrese el porcentaje en enteros con decimales (ej. 25.26 para 25.26 %).
            </p>
          )}

          {errores.porcentaje_venta?.map((mensaje) => (
            <p key={mensaje} className="mt-1 text-sm text-destructive">
              {mensaje}
            </p>
          ))}
        </Field>

        <CampoMetodo {...campo} campo="cod_moneda_venta" />

        <Field>
          <FieldLabel>Tipo de valor</FieldLabel>

          <InputGroup className="flex p-2">
            <RadioGroup
              value={row.es_porcentaje ? "porcentaje" : "valor"}
              onValueChange={(value: string) => cambiar({ es_porcentaje: value === "porcentaje" })}
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
