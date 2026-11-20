"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";
import { METODO_RANGO } from "@/features/pricing/shared";
import { Button } from "@/shared/components/ui/button";
import { crearIdLocal } from "@/shared/lib/id";
import { CampoMetodo } from "../campo-metodo";
import type { FilaMetodoRango, MonedaRangoOption } from "./rango-columns";

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

  const iniciarNuevo = () => {
    // Montos en "" y monedas en null (`inicial` en pricing/shared/lib/metodos/rango.ts).
    setRow({ localId: crearIdLocal(), ...METODO_RANGO.filaNueva() });
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

  // Requeridos ("Mínimo de Costo", ...) y venta >= costo: ver la definición del método.
  const validacion = METODO_RANGO.validar(row);

  const errores = [...validacion.faltantes, ...Object.values(validacion.errores).flat()];

  const cambiar = (cambio: Partial<FilaMetodoRango>) => {
    setRow((prev) => (prev ? { ...prev, ...cambio } : prev));
  };

  // Etiquetas, inputs y selects: de la definición. Los errores se listan abajo (no por campo).
  const campo = { metodo: METODO_RANGO, fila: row, onChange: cambiar, monedas };

  return (
    <div className="space-y-2">
      <div className="grid items-end gap-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-7">
        <CampoMetodo {...campo} campo="inicio" />
        <CampoMetodo {...campo} campo="costo_minimo" />
        <CampoMetodo {...campo} campo="venta_minimo" />
        <CampoMetodo {...campo} campo="costo" />
        <CampoMetodo {...campo} campo="cod_moneda_costo" />
        <CampoMetodo {...campo} campo="venta" />
        <CampoMetodo {...campo} campo="cod_moneda_venta" />
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
