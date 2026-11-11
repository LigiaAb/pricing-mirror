"use client";

import React from "react";

import {
  type TarifaCoberturaMutationPayload,
  useActualizarTarifaCobertura,
  useInsertarTarifaCobertura,
  useMonedasCobertura,
  useTarifaCobertura,
} from "../../../api/tarifa-cobertura";
import { useOpcionesMonedas } from "../../../hooks/use-opciones-tarifa";
import type { FilaCobertura, MonedaCoberturaOption } from "./cobertura-columns";
import { CoberturaForm } from "./cobertura-form";

type Props = {
  codMetodo?: string | number | null;

  readonly?: boolean;

  reConsultar?: () => void;
  onTarifaCreada?: () => void;

  /*
   * Lo mantengo para no cambiar la interfaz del
   * componente viejo, aunque actualmente no afecta
   * el payload final porque cod_rubro siempre se
   * envía null.
   */
  servicio?: Record<string, unknown>;
};

export function CoberturaTable({ codMetodo, readonly = false, onTarifaCreada = () => {} }: Props) {
  const coberturaQuery = useTarifaCobertura({
    ...(codMetodo == null ? {} : { codMetodo }),
  });

  const monedasQuery = useMonedasCobertura();

  const insertarCobertura = useInsertarTarifaCobertura();

  const actualizarCobertura = useActualizarTarifaCobertura();

  const monedas: MonedaCoberturaOption[] = useOpcionesMonedas(monedasQuery.data);

  /*
   * Igual que el viejo:
   * solamente toma data[0].
   */
  const cobertura = coberturaQuery.data?.[0] ?? null;

  const esNuevo = cobertura == null;

  const value = React.useMemo<FilaCobertura | null>(() => {
    if (!cobertura) return null;

    return {
      ...cobertura,

      moneda_costo:
        monedas.find(
          (moneda) => String(moneda.cod_moneda) === String(cobertura.cod_moneda_costo),
        ) ?? null,

      moneda_venta:
        monedas.find(
          (moneda) => String(moneda.cod_moneda) === String(cobertura.cod_moneda_venta),
        ) ?? null,
    };
  }, [cobertura, monedas]);

  const formatearFilaApi = React.useCallback(
    (fila: FilaCobertura): TarifaCoberturaMutationPayload | null => {
      if (codMetodo == null) {
        return null;
      }

      return {
        cod_tarifa_cobertura: fila.cod_tarifa_cobertura ?? 0,

        cod_metodo: codMetodo,

        porcentaje_costo: Number(fila.porcentaje_costo),

        porcentaje_venta: Number(fila.porcentaje_venta),

        minimo_venta: Number(fila.minimo_venta),

        minimo_costo: Number(fila.minimo_costo),

        cod_moneda_costo: fila.moneda_costo?.cod_moneda ?? null,

        cod_moneda_venta: fila.moneda_venta?.cod_moneda ?? null,

        /*
         * El código viejo hace esto tanto
         * al insertar como al actualizar.
         */
        cod_rubro: null,

        cod_estado: 1,
      };
    },
    [codMetodo],
  );

  const handleGuardar = React.useCallback(
    (fila: FilaCobertura) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      if (esNuevo) {
        insertarCobertura.mutate(payload, {
          onSuccess: () => {
            onTarifaCreada();
          },
        });

        return;
      }

      actualizarCobertura.mutate(payload);
    },
    [esNuevo, insertarCobertura, actualizarCobertura, formatearFilaApi, onTarifaCreada],
  );

  if (coberturaQuery.isLoading || monedasQuery.isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <CoberturaForm
      value={value}
      monedas={monedas}
      esNuevo={esNuevo}
      readonly={readonly}
      isPending={insertarCobertura.isPending || actualizarCobertura.isPending}
      onGuardar={handleGuardar}
    />
  );
}
