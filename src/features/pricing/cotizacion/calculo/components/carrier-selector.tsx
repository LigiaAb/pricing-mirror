"use client";

import React from "react";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import type { CarrierOption } from "../lib/carrier-flete";
import { getSimboloMoneda } from "../lib/utils";

type Props = {
  options: CarrierOption[];

  value: CarrierOption | null;

  lectura?: boolean;

  onChange: (option: CarrierOption | null) => void;
};

export function CarrierSelector({ options, value, lectura = false, onChange }: Props) {
  const { monedas } = useCatalogosCotizacion().calculo;

  const opcionesCombobox = React.useMemo<ComboboxOption[]>(
    () =>
      options.map((item) => {
        const metodo = item.servicio?.metodo;
        const simbolo = getSimboloMoneda(monedas, metodo?.cod_moneda_venta);
        const valor = metodo?.venta;
        const valorFormateado = Number.isNaN(Number(valor))
          ? String(valor ?? "")
          : Number(valor || 0.00001)
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return {
          value: String(item.value),
          label: `${String(item.entidad_nombre ?? item.label)} - [ ${simbolo}${valorFormateado} ]`,
          description: [item.label.split("(")[1]?.split(")")[0], `${simbolo}${valorFormateado}`]
            .filter(Boolean)
            .join(" · "),
        };
      }),
    [options, monedas],
  );

  return (
    <section className="rounded-lg border p-4">
      <div className="space-y-1">
        <label htmlFor="carrier" className="text-sm font-medium">
          Carrier
        </label>

        <Combobox
          id="carrier"
          value={value == null ? "" : String(value.value)}
          onChange={(selectedValue) => {
            onChange(options.find((option) => String(option.value) === selectedValue) ?? null);
          }}
          options={opcionesCombobox}
          ariaLabel="Carrier"
          disabled={lectura}
          placeholder="Seleccionar carrier..."
          searchPlaceholder="Buscar carrier..."
          emptyMessage="No se encontraron carriers."
        />
      </div>
    </section>
  );
}
