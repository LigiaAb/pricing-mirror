"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { Button } from "@/shared/components/ui/button";
import { FieldGroup } from "@/shared/components/ui/field";
import {
  type FilaPorcentaje,
  METODO_PORCENTAJE,
  type MonedaPorcentajeOption,
  type RubroPorcentajeOption,
} from "../../../lib/metodos/porcentaje";
import { obtenerCantidadDecimales } from "../../../lib/tarifa-helpers";
import { CampoMetodo } from "../campo-metodo";

type Props = {
  value?: FilaPorcentaje | null;

  monedas: MonedaPorcentajeOption[];
  rubros: RubroPorcentajeOption[];

  esNuevo: boolean;
  readonly?: boolean;
  isPending?: boolean;

  onGuardar: (row: FilaPorcentaje) => void;
};

/*
 * Nuevo: porcentajes en 0 (`inicial` en lib/metodos/porcentaje.ts).
 * `minimo: 0` se conserva del código viejo (no corresponde a ningún campo:
 * los mínimos son minimo_costo / minimo_venta; pendiente aparte).
 */
const filaNueva = (): FilaPorcentaje => ({
  ...METODO_PORCENTAJE.filaNueva(),
  minimo: 0,
  rubro: null,
  moneda_costo: null,
  moneda_venta: null,
});

export function PorcentajeForm({
  value,
  monedas,
  rubros,
  esNuevo,
  readonly = false,
  isPending = false,
  onGuardar,
}: Props) {
  const [row, setRow] = React.useState<FilaPorcentaje>(value ?? filaNueva());

  React.useEffect(() => {
    setRow(value ?? filaNueva());
  }, [value]);

  const cambiar = React.useCallback((cambio: Partial<FilaPorcentaje>) => {
    setRow((prev) => ({ ...prev, ...cambio }));
  }, []);

  // Monedas requeridas, venta >= costo y porcentajes entre 0 y 100: ver lib/metodos/porcentaje.ts.
  const { valido, errores } = METODO_PORCENTAJE.validar(row);

  // Se conserva exactamente la condición vieja.
  const advertenciaDecimalesCosto = obtenerCantidadDecimales(row.porcentaje_costo) > 9;

  const advertenciaDecimalesVenta = obtenerCantidadDecimales(row.porcentaje_venta) > 9;

  const puedeGuardar = !readonly && valido;

  const campo = {
    metodo: METODO_PORCENTAJE,
    fila: row,
    onChange: cambiar,
    monedas,
    rubros,
    readonly,
    errores,
    comboEnvuelto: true,
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
          <CampoMetodo {...campo} campo="minimo_costo" />
          <CampoMetodo {...campo} campo="minimo_venta" />
        </FieldGroup>

        <CampoMetodo {...campo} campo="cod_moneda_costo" />

        <CampoMetodo {...campo} campo="porcentaje_costo" />

        <CampoMetodo {...campo} campo="cod_moneda_venta" />

        <CampoMetodo {...campo} campo="porcentaje_venta" />

        <CampoMetodo {...campo} campo="cod_rubro" />
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
