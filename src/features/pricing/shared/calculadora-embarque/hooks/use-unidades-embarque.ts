"use client";

import React from "react";

import { relacionTipo } from "@/features/catalogos";

import { conAmbosFormatos } from "../../lib/formatos";
import { esUnidadEmbarque, normalizarUnidades } from "../lib/unidades";

/**
 * Unidades de medida y de peso de la calculadora de embarques.
 *
 * La calculadora las lee sola: no hace falta provider ni pasarlas por props.
 * Usa la misma consulta y filtros que `useCatalogosPricing`, así que React
 * Query no repite la llamada si la pantalla ya cargó los catálogos.
 */
export function useUnidadesEmbarque() {
  const relaciones = relacionTipo.useLista({ cod_estado: 1 });

  const data = relaciones.data as Array<Record<string, unknown>> | undefined;

  const unidades = React.useMemo(() => {
    const todas = (data ?? []).map(conAmbosFormatos).map((item) => ({
      ...item,
      value: item.cod_tipo as string | number,
      label: String(item.label ?? item.tipo_desc ?? ""),
    }));

    return {
      unidadesMedida: normalizarUnidades(todas.filter((t) => esUnidadEmbarque(t, "VOLUMEN"))),
      unidadesPeso: normalizarUnidades(todas.filter((t) => esUnidadEmbarque(t, "PESO"))),
    };
  }, [data]);

  return { ...unidades, isLoading: Boolean(relaciones.isLoading) };
}
