"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  type FilaCobertura,
  METODO_COBERTURA,
  type MonedaCoberturaOption,
} from "../../../lib/metodos/cobertura";
import { obtenerCantidadDecimales } from "../../../lib/tarifa-helpers";
import { CampoMetodo } from "../campo-metodo";

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
  // Nuevo: porcentajes y mínimos en 0 (`inicial` en lib/metodos/cobertura.ts).
  const [row, setRow] = React.useState<FilaCobertura>(value ?? METODO_COBERTURA.filaNueva());

  React.useEffect(() => {
    setRow(value ?? METODO_COBERTURA.filaNueva());
  }, [value]);

  const cambiar = React.useCallback((cambio: Partial<FilaCobertura>) => {
    setRow((prev) => ({ ...prev, ...cambio }));
  }, []);

  // Monedas requeridas y venta >= costo: ver lib/metodos/cobertura.ts.
  const { valido, errores } = METODO_COBERTURA.validar(row);

  /*
   * Se conserva la condición del código viejo:
   * > 9.
   *
   * Aunque el mensaje dice "más de 8 decimales".
   */
  const errorDecimalesCosto = obtenerCantidadDecimales(row.porcentaje_costo) > 9;

  const errorDecimalesVenta = obtenerCantidadDecimales(row.porcentaje_venta) > 9;

  const puedeGuardar = !readonly && valido;

  const campo = { metodo: METODO_COBERTURA, fila: row, onChange: cambiar, monedas, readonly, errores };

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
        <CampoMetodo {...campo} campo="minimo_costo" />

        <CampoMetodo {...campo} campo="minimo_venta" />

        <CampoMetodo {...campo} campo="cod_moneda_costo" />

        <CampoMetodo {...campo} campo="porcentaje_costo" />

        <CampoMetodo {...campo} campo="cod_moneda_venta" />

        <CampoMetodo {...campo} campo="porcentaje_venta" />
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
