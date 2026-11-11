"use client";

import React from "react";

import {
  calcularTotalesMedidas,
  type DimensionCalculo,
  reconstruirDimensiones,
  type TotalesMedidas,
} from "../lib/calculadora-medidas";

import {
  normalizarBooleanCriterio,
  prepararCriteriosCalculo,
  type ValoresCriterios,
} from "../lib/criterios-cotizacion";

import type { Id } from "../lib/tipos";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Props = {
  /**
   * Identifica la versión actual.
   *
   * Cuando cambia, se reconstruyen:
   * - criterios
   * - dimensiones
   */
  resetKey: string | number;

  /**
   * Valores cargados desde la versión.
   */
  valoresIniciales: ValoresCriterios;

  /**
   * Dimensiones guardadas en BD.
   */
  dimensionesIniciales: Array<Record<string, unknown>>;

  codTipoTransporte?: Id | null;
};

export function useCriteriosCotizacion({
  resetKey,

  valoresIniciales,

  dimensionesIniciales,

  codTipoTransporte,
}: Props) {
  const { unidadesMedida, unidadesPeso } = useCatalogosCotizacion().calculo;

  /* ==========================================================================
   * ESTADO
   * ========================================================================== */

  const [valores, setValores] = React.useState<ValoresCriterios>({});

  const [dimensiones, setDimensiones] = React.useState<DimensionCalculo[]>([]);

  /* ==========================================================================
   * CARGAR / CAMBIAR VERSIÓN
   * ========================================================================== */

  React.useEffect(() => {
    // resetKey es un disparador intencional al cambiar de versión.
    void resetKey;

    // Los totales guardados son globales y se repiten en cada fila.
    const totalesGuardados = dimensionesIniciales[0];
    const peso =
      totalesGuardados?.total_peso ??
      valoresIniciales.total_peso ??
      valoresIniciales.valor_por_peso;
    const volumen = totalesGuardados?.total_volumen ?? valoresIniciales.total_volumen;
    const cw = totalesGuardados?.total_cw ?? valoresIniciales.total_cw ?? valoresIniciales.valor_cw;

    setValores({
      ...valoresIniciales,
      ...(peso == null ? {} : { total_peso: Number(peso), valor_por_peso: Number(peso) }),
      ...(volumen == null ? {} : { total_volumen: Number(volumen) }),
      ...(cw == null ? {} : { total_cw: Number(cw), valor_cw: Number(cw) }),

      express: normalizarBooleanCriterio(valoresIniciales?.express),
    });
  }, [resetKey, valoresIniciales, dimensionesIniciales]);

  React.useEffect(() => {
    // resetKey es un disparador intencional al cambiar de versión.
    void resetKey;

    setDimensiones(
      reconstruirDimensiones({
        dimensiones: dimensionesIniciales,

        unidadesMedida,

        unidadesPeso,

        codTipoTransporte: codTipoTransporte ?? null,
      }),
    );
  }, [resetKey, dimensionesIniciales, unidadesMedida, unidadesPeso, codTipoTransporte]);

  /* ==========================================================================
   * TOTALES DE LAS FILAS DE DIMENSIONES
   *
   * IMPORTANTE:
   * Estos son únicamente los totales derivados de las filas.
   *
   * El usuario también puede ingresar KILOS / VOLUMÉTRICO directamente
   * desde CalculadoraMedidas.
   *
   * En ese caso el valor definitivo vive en:
   *
   * valores.valor_cw
   * valores.valor_por_peso
   * valores.total_peso
   * valores.total_volumen
   * valores.total_cw
   * ========================================================================== */

  const totalesDimensiones = React.useMemo(
    () => calcularTotalesMedidas(dimensiones, codTipoTransporte),
    [dimensiones, codTipoTransporte],
  );

  /* ==========================================================================
   * CAMBIAR UN CAMPO
   * ========================================================================== */

  const cambiarValor = React.useCallback((campo: string, valor: unknown) => {
    setValores((prev) => ({
      ...prev,

      [campo]: valor,
    }));
  }, []);

  /* ==========================================================================
   * ACTUALIZAR VARIOS CAMPOS
   *
   * Esto se usa, por ejemplo, cuando Carrier determina:
   *
   * - valor_flete
   * - categoria_transporte
   * ========================================================================== */

  const actualizarValores = React.useCallback((next: Partial<ValoresCriterios>) => {
    setValores((prev) => ({
      ...prev,
      ...next,
    }));
  }, []);

  /* ==========================================================================
   * APLICAR RESULTADO DE LA CALCULADORA
   * ========================================================================== */

  const aplicarMedidas = React.useCallback(
    ({
      dimensiones: nuevasDimensiones,

      totales,
    }: {
      dimensiones: DimensionCalculo[];

      totales: TotalesMedidas;
    }) => {
      setDimensiones(
        nuevasDimensiones.map((dimension) => ({
          ...dimension,
          total_peso: totales.pesoTotal,
          total_volumen: totales.volumenTotal,
          total_cw: totales.valorCw,
        })),
      );

      setValores((prev) => ({
        ...prev,

        /*
         * Peso real calculado.
         */
        valor_por_peso: totales.pesoTotal,

        /*
         * Chargeable Weight.
         */
        valor_cw: totales.valorCw,

        /*
         * Se conservan también los
         * totales necesarios para
         * guardar dimensiones.
         */
        total_peso: totales.pesoTotal,

        total_volumen: totales.volumenTotal,

        total_cw: totales.valorCw,
      }));
    },
    [],
  );

  /* ==========================================================================
   * CRITERIOS LISTOS PARA API
   *
   * NO ejecuta ninguna consulta.
   *
   * Solo transforma:
   * - catalog options -> value
   * - categoria "0" -> null
   * - express -> boolean
   * ========================================================================== */

  const obtenerCriteriosCalculo = React.useCallback(() => {
    return prepararCriteriosCalculo(valores);
  }, [valores]);

  /* ==========================================================================
   * VALORES DERIVADOS
   * ========================================================================== */

  const valorCw = React.useMemo(() => Number(valores.valor_cw ?? 0), [valores.valor_cw]);

  const valorPeso = React.useMemo(
    () => Number(valores.valor_por_peso ?? 0),
    [valores.valor_por_peso],
  );

  /* ==========================================================================
   * RETURN
   * ========================================================================== */

  return {
    /* Estado */

    valores,

    dimensiones,

    /* Valores derivados */

    valorCw,

    valorPeso,

    totalesDimensiones,

    /* Edición */

    cambiarValor,

    actualizarValores,

    setDimensiones,

    aplicarMedidas,

    /* Payload */

    obtenerCriteriosCalculo,
  };
}
