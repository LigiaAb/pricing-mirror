"use client";

import React from "react";
import { Loader } from "@/shared/components/ui/loader";
import {
  type TarifaCostoVentaMutationPayload,
  useActualizarTarifaCostoVenta,
  useInsertarTarifaCostoVenta,
  useMonedasCostoVenta,
  useTarifaCostoVenta,
} from "../../../api/tarifa-costoventa";
import type { FilaCostoVenta, MonedaCostoVentaOption } from "./costo-venta-columns";
import { CostoVentaForm } from "./costo-venta-form";
import { useOpcionesMonedas } from "../../../hooks/use-opciones-tarifa";

type Props = {
  codMetodo?: string | number | null;
  codServicio?: string | number | null;

  readonly?: boolean;

  reConsultar?: () => void;
  onTarifaCreada?: () => void;
};

export function CostoVentaTable({
  codMetodo,
  codServicio,
  readonly = false,
  onTarifaCreada = () => {},
}: Props) {
  const costoVentaQuery = useTarifaCostoVenta({
    ...(codMetodo == null ? {} : { codMetodo }),
  });

  const monedasQuery = useMonedasCostoVenta();

  const insertarCostoVenta = useInsertarTarifaCostoVenta();

  const actualizarCostoVenta = useActualizarTarifaCostoVenta();

  const monedas: MonedaCostoVentaOption[] = useOpcionesMonedas(monedasQuery.data);

  const costoVenta = costoVentaQuery.data?.[0] ?? null;

  const esNuevo = costoVenta == null;

  const value = React.useMemo<FilaCostoVenta | null>(() => {
    if (!costoVenta) return null;

    return {
      ...costoVenta,

      moneda_costo:
        monedas.find(
          (moneda) => String(moneda.cod_moneda) === String(costoVenta.cod_moneda_costo),
        ) ?? null,

      moneda_venta:
        monedas.find(
          (moneda) => String(moneda.cod_moneda) === String(costoVenta.cod_moneda_venta),
        ) ?? null,
    };
  }, [costoVenta, monedas]);

  const formatearFilaApi = React.useCallback(
    (fila: FilaCostoVenta): TarifaCostoVentaMutationPayload | null => {
      if (codMetodo == null) return null;

      return {
        cod_tarifa_costoventa: fila.cod_tarifa_costoventa ?? null,

        cod_metodo: codMetodo,

        cod_servicio: codServicio ?? null,

        costo: Number(fila.costo),

        venta: Number(fila.venta),

        cod_moneda_costo: fila.moneda_costo?.cod_moneda ?? null,

        cod_moneda_venta: fila.moneda_venta?.cod_moneda ?? null,

        cod_estado: 1,
      };
    },
    [codMetodo, codServicio],
  );

  const handleGuardar = React.useCallback(
    (fila: FilaCostoVenta) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      if (esNuevo) {
        insertarCostoVenta.mutate(payload, {
          onSuccess: () => {
            // El código viejo solamente lo llamaba
            // después de insertar.
            onTarifaCreada();
          },
        });

        return;
      }

      actualizarCostoVenta.mutate(payload);
    },
    [esNuevo, insertarCostoVenta, actualizarCostoVenta, formatearFilaApi, onTarifaCreada],
  );

  if (costoVentaQuery.isLoading || monedasQuery.isLoading) {
    return <Loader />;
  }

  return (
    <CostoVentaForm
      value={value}
      monedas={monedas}
      esNuevo={esNuevo}
      readonly={readonly}
      isPending={insertarCostoVenta.isPending || actualizarCostoVenta.isPending}
      onGuardar={handleGuardar}
    />
  );
}
