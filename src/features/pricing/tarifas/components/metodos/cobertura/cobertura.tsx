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
import {
  type FilaCobertura,
  METODO_COBERTURA,
  type MonedaCoberturaOption,
} from "../../../lib/metodos/cobertura";
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

/**
 * Tarifa de método Cobertura: consulta, formulario y guardado.
 * Componente padre reutilizable: basta con `<MetodoCobertura codMetodo={...} />`.
 */
export function MetodoCobertura({ codMetodo, readonly = false, onTarifaCreada = () => {} }: Props) {
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

  const value = React.useMemo<FilaCobertura | null>(
    () => (cobertura ? METODO_COBERTURA.aFila(cobertura, { monedas }) : null),
    [cobertura, monedas],
  );

  // cod_tarifa_cobertura ?? 0 y cod_rubro: null (al insertar y al actualizar): ver la definición.
  const formatearFilaApi = React.useCallback(
    (fila: FilaCobertura): TarifaCoberturaMutationPayload | null => {
      if (codMetodo == null) return null;

      return METODO_COBERTURA.aPayload(fila, { codMetodo });
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
