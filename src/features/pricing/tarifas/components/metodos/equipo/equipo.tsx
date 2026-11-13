"use client";

import React from "react";

/*
 * IMPORTANTE:
 *
 * Usa aquí la ruta REAL de tu hook de equipos.
 *
 * El componente viejo hace:
 *
 * useFetchEquipos({
 *   equipo_operativo: true
 * })
 */
// import { useFetchEquipos } from "RUTA_REAL";

import {
  useActualizarTarifaEquipo,
  useInsertarTarifaEquipo,
  useMonedasEquipo,
  useTarifaEquipo,
} from "../../../api/tarifa-equipo";
import {
  type EquipoOption,
  type FilaEquipo,
  METODO_EQUIPO,
  type MonedaEquipoOption,
} from "../../../lib/metodos/equipo";
import { EquipoForm } from "./equipo-form";

type Props = {
  codMetodo?: string | number | null;

  readonly?: boolean;

  onTarifaCreada?: () => void;
};

/**
 * Tarifa de método Equipo: consulta, formulario y guardado.
 * Componente padre reutilizable: basta con `<MetodoEquipo codMetodo={...} />`.
 */
export function MetodoEquipo({ codMetodo, readonly = false, onTarifaCreada = () => {} }: Props) {
  /*
   * =========================================================
   * CONSULTAS
   * =========================================================
   */

  const tarifaEquipo = useTarifaEquipo({
    codEstado: 1,

    ...(codMetodo == null
      ? {}
      : {
          codMetodo,
        }),
  });

  const monedasFetch = useMonedasEquipo();

  /*
   * Esta consulta permanece dentro
   * del componente, igual que en el
   * código viejo.
   */
  const equiposFetch = { data: [] }; /* useFetchEquipos({
    equipo_operativo: true,
  }); */

  const insertar = useInsertarTarifaEquipo();

  const actualizar = useActualizarTarifaEquipo();

  /*
   * =========================================================
   * CATÁLOGO EQUIPOS
   * =========================================================
   *
   * El hook viejo ya entrega:
   *
   * {
   *   value,
   *   label,
   *   ...
   * }
   */

  const equipos = React.useMemo<EquipoOption[]>(
    () => (equiposFetch.data ?? []) as EquipoOption[],
    [equiposFetch.data],
  );

  /*
   * =========================================================
   * CATÁLOGO MONEDAS
   * =========================================================
   */

  const monedas = React.useMemo<MonedaEquipoOption[]>(
    () =>
      (monedasFetch.data ?? []).map((moneda) => ({
        ...moneda,

        value: moneda.cod_moneda,

        label: `${moneda.simbolo_moneda} - ${moneda.nom_moneda}`,

        cod_moneda: moneda.cod_moneda,

        simbolo: moneda.simbolo_moneda,
      })),
    [monedasFetch.data],
  );

  /*
   * =========================================================
   * API -> FORMULARIO
   * =========================================================
   *
   * Igual que el viejo:
   * solamente utiliza data[0].
   */

  const values = React.useMemo<FilaEquipo>(() => {
    const equipo = tarifaEquipo.data?.[0];

    if (!equipo) {
      // Todo vacío y cod_estado 1 (`inicial` en lib/metodos/equipo.ts).
      return {
        cod_tarifa_equipo: null,

        cod_metodo: codMetodo ?? null,

        ...METODO_EQUIPO.filaNueva(),
      };
    }

    return METODO_EQUIPO.aFila(equipo, { equipos, monedasEquipo: monedas });
  }, [tarifaEquipo.data, equipos, monedas, codMetodo]);

  /*
   * =========================================================
   * GUARDAR
   * =========================================================
   */

  const handleGuardar = React.useCallback(
    async (fila: FilaEquipo) => {
      if (codMetodo == null || Number(codMetodo) === 0) {
        return;
      }

      /*
       * Payload común (ver lib/metodos/equipo.ts): Number(costo), Number(venta),
       * option.value || null y cod_estado = 1. Sin cod_tarifa_equipo: al insertar
       * no se envía y al actualizar va al final, igual que el código viejo.
       */
      const { cod_tarifa_equipo: _id, ...payloadBase } = METODO_EQUIPO.aPayload(fila, {
        codMetodo,
      });

      /*
       * INSERT
       */
      if (!fila.cod_tarifa_equipo) {
        await insertar.mutateAsync(payloadBase);

        /*
         * Igual que el viejo:
         * solamente después del INSERT.
         */
        onTarifaCreada();

        return;
      }

      /*
       * UPDATE
       */
      await actualizar.mutateAsync({
        ...payloadBase,

        cod_tarifa_equipo: fila.cod_tarifa_equipo,
      });
    },
    [codMetodo, insertar, actualizar, onTarifaCreada],
  );

  return (
    <EquipoForm
      value={values}
      equipos={equipos}
      monedas={monedas}
      readonly={readonly}
      isPending={insertar.isPending || actualizar.isPending}
      onGuardar={handleGuardar}
    />
  );
}
