"use client";

import React from "react";
import { rubros as useRubrosFetch } from "@/features/catalogos";

import {
  type TarifaCostoPorcentajejeMutationPayload,
  useActualizarTarifaCostoPorcentajeje,
  useInsertarTarifaCostoPorcentajeje,
  useMonedasPorcentaje,
  useTarifaCostoPorcentajeje,
} from "../../../api/tarifa-costo-porcentaje";
import { useOpcionesMonedas, useOpcionesRubros } from "../../../hooks/use-opciones-tarifa";
import {
  type FilaCostoPorcentaje,
  METODO_COSTO_PORCENTAJE,
  type MonedaCostoPorcentajeOption,
  type RubroCostoPorcentajeOption,
} from "../../../lib/metodos/costo-porcentaje";
import { CostoPorcentajeForm } from "./costo-porcentaje-form";

type Props = {
  codMetodo?: string | number | null;

  readonly?: boolean;

  reConsultar?: () => void;
  onTarifaCreada?: () => void;

  // Se conserva por compatibilidad con el viejo.
  servicio?: Record<string, unknown>;
};

/**
 * Tarifa de método Costo por Porcentaje: consulta, formulario y guardado.
 * Componente padre reutilizable: basta con `<MetodoCostoPorcentaje codMetodo={...} />`.
 */
export function MetodoCostoPorcentaje({
  codMetodo,
  readonly = false,
  reConsultar = () => {},
  onTarifaCreada = () => {},
}: Props) {
  const porcentajeQuery = useTarifaCostoPorcentajeje({
    ...(codMetodo == null ? {} : { codMetodo }),
  });

  const rubrosFetch = useRubrosFetch.useLista();

  const rubros: RubroCostoPorcentajeOption[] = useOpcionesRubros(rubrosFetch.data);

  const monedasQuery = useMonedasPorcentaje();

  const insertarPorcentaje = useInsertarTarifaCostoPorcentajeje();

  const actualizarPorcentaje = useActualizarTarifaCostoPorcentajeje();

  const monedas: MonedaCostoPorcentajeOption[] = useOpcionesMonedas(monedasQuery.data);

  /*
   * Igual que el componente viejo:
   * solo utiliza data[0].
   */
  const porcentaje = porcentajeQuery.data?.[0] ?? null;

  const esNuevo = porcentaje == null;

  const value = React.useMemo<FilaCostoPorcentaje | null>(
    () => (porcentaje ? METODO_COSTO_PORCENTAJE.aFila(porcentaje, { monedas, rubros }) : null),
    [porcentaje, monedas, rubros],
  );

  // cod_tarifa_porcentaje ?? 0, mínimos vacíos como 0 y Boolean(es_porcentaje): ver la definición.
  const formatearFilaApi = React.useCallback(
    (fila: FilaCostoPorcentaje): TarifaCostoPorcentajejeMutationPayload | null => {
      if (codMetodo == null) return null;

      return METODO_COSTO_PORCENTAJE.aPayload(fila, { codMetodo });
    },
    [codMetodo],
  );

  const handleGuardar = React.useCallback(
    (fila: FilaCostoPorcentaje) => {
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
    <CostoPorcentajeForm
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
