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
  type TarifaEquipoMutationPayload,
  useActualizarTarifaEquipo,
  useInsertarTarifaEquipo,
  useMonedasEquipo,
  useTarifaEquipo,
} from "../../../api/tarifa-equipo";

import {
  EquipoForm,
  type EquipoOption,
  type FilaEquipo,
  type MonedaEquipoOption,
} from "./equipo-form";

type Props = {
  codMetodo?: string | number | null;

  readonly?: boolean;

  onTarifaCreada?: () => void;
};

export function EquipoTable({ codMetodo, readonly = false, onTarifaCreada = () => {} }: Props) {
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
      return {
        cod_tarifa_equipo: null,

        cod_metodo: codMetodo ?? null,

        cod_equipo: null,

        costo: null,

        venta: null,

        cod_moneda_costo: null,

        cod_moneda_venta: null,

        cod_estado: 1,
      };
    }

    return {
      ...equipo,

      cod_equipo: equipos.find((item) => String(item.value) === String(equipo.cod_equipo)) ?? null,

      cod_moneda_costo:
        monedas.find((item) => String(item.value) === String(equipo.cod_moneda_costo)) ?? null,

      cod_moneda_venta:
        monedas.find((item) => String(item.value) === String(equipo.cod_moneda_venta)) ?? null,
    };
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
       * Payload común.
       *
       * Se conserva:
       *
       * Number(costo)
       * Number(venta)
       * option.value || null
       * cod_estado = 1
       */
      const payloadBase = {
        costo: Number(fila.costo),

        venta: Number(fila.venta),

        cod_metodo: codMetodo,

        cod_equipo: fila.cod_equipo?.value || null,

        cod_moneda_costo: fila.cod_moneda_costo?.value || null,

        cod_moneda_venta: fila.cod_moneda_venta?.value || null,

        cod_estado: 1,
      } satisfies Omit<TarifaEquipoMutationPayload, "cod_tarifa_equipo">;

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
