"use client";

import React from "react";
import { rubros as useRubrosFetch } from "@/features/catalogos";

import {
  type TarifaPorcentajeMutationPayload,
  useActualizarTarifaPorcentaje,
  useInsertarTarifaPorcentaje,
  useMonedasPorcentaje,
  useTarifaPorcentaje,
} from "../../../api/tarifa-porcentaje";
import type {
  FilaPorcentaje,
  MonedaPorcentajeOption,
  RubroPorcentajeOption,
} from "./porcentaje-columns";
import { PorcentajeForm } from "./porcentaje-form";
import { useOpcionesMonedas, useOpcionesRubros } from "../../../hooks/use-opciones-tarifa";

type Props = {
  codMetodo?: string | number | null;

  readonly?: boolean;

  reConsultar?: () => void;
  onTarifaCreada?: () => void;

  // Se conserva por compatibilidad con el viejo.
  servicio?: Record<string, unknown>;
};

export function PorcentajeTable({
  codMetodo,
  readonly = false,
  reConsultar = () => {},
  onTarifaCreada = () => {},
}: Props) {
  const porcentajeQuery = useTarifaPorcentaje({
    ...(codMetodo == null ? {} : { codMetodo }),
  });

  const rubrosFetch = useRubrosFetch.useLista();

  const rubros: RubroPorcentajeOption[] = useOpcionesRubros(rubrosFetch.data);

  const monedasQuery = useMonedasPorcentaje();

  const insertarPorcentaje = useInsertarTarifaPorcentaje();

  const actualizarPorcentaje = useActualizarTarifaPorcentaje();

  const monedas: MonedaPorcentajeOption[] = useOpcionesMonedas(monedasQuery.data);

  /*
   * Igual que el componente viejo:
   * solo utiliza data[0].
   */
  const porcentaje = porcentajeQuery.data?.[0] ?? null;

  const esNuevo = porcentaje == null;

  const value = React.useMemo<FilaPorcentaje | null>(() => {
    if (!porcentaje) return null;

    return {
      ...porcentaje,

      moneda_costo:
        monedas.find(
          (moneda) => String(moneda.cod_moneda) === String(porcentaje.cod_moneda_costo),
        ) ?? null,

      moneda_venta:
        monedas.find(
          (moneda) => String(moneda.cod_moneda) === String(porcentaje.cod_moneda_venta),
        ) ?? null,

      rubro:
        rubros.find(
          (rubro) => String(rubro.cod_rubro ?? rubro.value) === String(porcentaje.cod_rubro),
        ) ?? null,
    };
  }, [porcentaje, monedas, rubros]);

  const formatearFilaApi = React.useCallback(
    (fila: FilaPorcentaje): TarifaPorcentajeMutationPayload | null => {
      if (codMetodo == null) {
        return null;
      }

      return {
        cod_tarifa_porcentaje: fila.cod_tarifa_porcentaje ?? 0,

        cod_metodo: codMetodo,

        porcentaje_costo: Number(fila.porcentaje_costo),

        porcentaje_venta: Number(fila.porcentaje_venta),

        minimo_costo: Number(fila.minimo_costo ?? 0),
        minimo_venta: Number(fila.minimo_venta ?? 0),

        cod_rubro: fila.rubro?.cod_rubro ?? fila.rubro?.value ?? null,

        cod_moneda_costo: fila.moneda_costo?.cod_moneda ?? null,

        cod_moneda_venta: fila.moneda_venta?.cod_moneda ?? null,

        cod_estado: 1,
      };
    },
    [codMetodo],
  );

  const handleGuardar = React.useCallback(
    (fila: FilaPorcentaje) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      if (esNuevo) {
        insertarPorcentaje.mutate(payload, {
          onSuccess: () => {
            /*
             * Igual al viejo:
             * solo al insertar llama ambos.
             */
            reConsultar();
            onTarifaCreada();
          },
        });

        return;
      }

      actualizarPorcentaje.mutate(payload);
    },
    [
      esNuevo,
      insertarPorcentaje,
      actualizarPorcentaje,
      formatearFilaApi,
      reConsultar,
      onTarifaCreada,
    ],
  );

  if (porcentajeQuery.isLoading || monedasQuery.isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <PorcentajeForm
      value={value}
      monedas={monedas}
      rubros={rubros}
      esNuevo={esNuevo}
      readonly={readonly}
      isPending={insertarPorcentaje.isPending || actualizarPorcentaje.isPending}
      onGuardar={handleGuardar}
    />
  );
}
