"use client";

import React from "react";

import type { RubroCalculo } from "../api/calculo-cotizacion";

import { procesarRubrosCalculados } from "../lib/procesar-rubros-calculados";

import {
  normalizarRubrosGuardados,
  type RubroGuardado,
  separarRubrosGuardados,
} from "../lib/rubros-guardados";

import type { Id } from "../lib/tipos";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Props = {
  lectura: boolean;

  /* ===========================
   * CÁLCULO VIVO
   * =========================== */

  rubrosCalculados?: RubroCalculo[];

  entidadSeleccionadaId?: Id | null;

  categoriaSeleccionada?: string | null;

  codRubroFleteSeleccionado?: Id | null;

  codServicioFleteSeleccionado?: Id | null;

  valorCw?: unknown;

  /* ===========================
   * LECTURA
   * =========================== */

  rubrosGuardados?: RubroGuardado[];

  /** Define el texto del detalle de flete (ver lib/detalle-flete.ts). */
  codTipoTransporte?: Id | null;
};

export function useRubrosCotizacion({
  lectura,

  rubrosCalculados = [],

  entidadSeleccionadaId,

  categoriaSeleccionada,

  codRubroFleteSeleccionado,

  codServicioFleteSeleccionado,

  valorCw,

  rubrosGuardados = [],

  codTipoTransporte,
}: Props) {
  const {
    categoriasTransporte: categorias,
    monedas,
    rubros: rubrosCatalogo,
    servicios: serviciosCatalogo,
    proveedores: entidades,
  } = useCatalogosCotizacion().calculo;

  const rubrosLectura = React.useMemo(() => {
    if (!lectura) {
      return null;
    }

    const normalizados = normalizarRubrosGuardados({
      rubros: rubrosGuardados,

      rubrosCatalogo,

      serviciosCatalogo,

      monedas,

      entidades,
    });

    return separarRubrosGuardados(normalizados);
  }, [lectura, rubrosGuardados, rubrosCatalogo, serviciosCatalogo, monedas, entidades]);

  const rubrosCalculo = React.useMemo(() => {
    if (lectura) {
      return null;
    }

    return procesarRubrosCalculados({
      rubros: rubrosCalculados,

      entidadSeleccionadaId: entidadSeleccionadaId ?? null,

      categoriaSeleccionada: categoriaSeleccionada ?? null,

      codRubroFleteSeleccionado: codRubroFleteSeleccionado ?? null,

      codServicioFleteSeleccionado: codServicioFleteSeleccionado ?? null,

      valorCw,

      categorias,

      monedas,

      serviciosCatalogo,

      codTipoTransporte: codTipoTransporte ?? null,
    });
  }, [
    lectura,
    rubrosCalculados,
    codTipoTransporte,
    entidadSeleccionadaId,
    categoriaSeleccionada,
    codRubroFleteSeleccionado,
    codServicioFleteSeleccionado,
    valorCw,
    categorias,
    monedas,
    serviciosCatalogo,
  ]);

  const resultado = lectura ? rubrosLectura : rubrosCalculo;

  return {
    rubrosDueCarrier: resultado?.rubrosDueCarrier ?? [],

    rubrosDueAgent: resultado?.rubrosDueAgent ?? [],

    rubrosScalling: resultado?.rubrosScalling ?? [],
  };
}
