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
import { useOpcionesMonedas } from "../../../hooks/use-opciones-tarifa";
import {
  type FilaCostoVenta,
  METODO_COSTO_VENTA,
  type MonedaCostoVentaOption,
} from "../../../lib/metodos/costo-venta";
import { CostoVentaForm } from "./costo-venta-form";

type Props = {
  codMetodo?: string | number | null;
  codServicio?: string | number | null;

  readonly?: boolean;

  reConsultar?: () => void;
  onTarifaCreada?: () => void;
};

/**
 * Tarifa de método Costo / Venta de un método de cálculo: consulta, formulario y guardado.
 * Componente padre reutilizable: basta con `<MetodoCostoVenta codMetodo={...} />`.
 */
export function MetodoCostoVenta({
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

  const value = React.useMemo<FilaCostoVenta | null>(
    () => (costoVenta ? METODO_COSTO_VENTA.aFila(costoVenta, { monedas }) : null),
    [costoVenta, monedas],
  );

  const formatearFilaApi = React.useCallback(
    (fila: FilaCostoVenta): TarifaCostoVentaMutationPayload | null => {
      if (codMetodo == null) return null;

      return METODO_COSTO_VENTA.aPayload(fila, { codMetodo, codServicio });
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
