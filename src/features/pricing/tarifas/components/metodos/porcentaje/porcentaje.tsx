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
import { useOpcionesMonedas, useOpcionesRubros } from "../../../hooks/use-opciones-tarifa";
import {
  type FilaPorcentaje,
  METODO_PORCENTAJE,
  type MonedaPorcentajeOption,
  type RubroPorcentajeOption,
} from "../../../lib/metodos/porcentaje";
import { PorcentajeForm } from "./porcentaje-form";

type Props = {
  codMetodo?: string | number | null;

  readonly?: boolean;

  reConsultar?: () => void;
  onTarifaCreada?: () => void;

  // Se conserva por compatibilidad con el viejo.
  servicio?: Record<string, unknown>;
};

/**
 * Tarifa de método Porcentaje (por rubro): consulta, formulario y guardado.
 * Componente padre reutilizable: basta con `<MetodoPorcentaje codMetodo={...} />`.
 */
export function MetodoPorcentaje({
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

  const value = React.useMemo<FilaPorcentaje | null>(
    () => (porcentaje ? METODO_PORCENTAJE.aFila(porcentaje, { monedas, rubros }) : null),
    [porcentaje, monedas, rubros],
  );

  // cod_tarifa_porcentaje ?? 0 y mínimos vacíos como 0: ver la definición.
  const formatearFilaApi = React.useCallback(
    (fila: FilaPorcentaje): TarifaPorcentajeMutationPayload | null => {
      if (codMetodo == null) return null;

      return METODO_PORCENTAJE.aPayload(fila, { codMetodo });
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
