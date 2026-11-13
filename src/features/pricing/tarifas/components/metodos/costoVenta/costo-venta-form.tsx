"use client";

import { Plus, Save } from "lucide-react";
import React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  type FilaCostoVenta,
  METODO_COSTO_VENTA,
  type MonedaCostoVentaOption,
} from "../../../lib/metodos/costo-venta";
import { CampoMetodo } from "../campo-metodo";

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

  const cambiar = React.useCallback((cambio: Partial<FilaCostoVenta>) => {
    setRow((prev) => ({ ...prev, ...cambio }));
  }, []);

  // Requeridos (costo, venta y monedas) y venta >= costo: ver lib/metodos/costo-venta.ts.
  const { valido, errores } = METODO_COSTO_VENTA.validar(row);

  const puedeGuardar = !readonly && valido;

  const campo = { metodo: METODO_COSTO_VENTA, fila: row, onChange: cambiar, monedas, readonly };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CampoMetodo {...campo} campo="cod_moneda_costo" />

        <CampoMetodo {...campo} campo="costo" />

        <CampoMetodo {...campo} campo="cod_moneda_venta" />

        <CampoMetodo {...campo} campo="venta">
          {errores.venta && <p className="mt-1 text-sm text-destructive">{errores.venta}</p>}
        </CampoMetodo>
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
