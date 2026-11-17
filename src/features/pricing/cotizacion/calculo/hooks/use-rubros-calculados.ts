"use client";

import React from "react";

import type { RubroCalculo } from "../api/calculo-cotizacion";

import type { CatalogoTipo, MonedaFlete } from "../lib/carrier-flete";

import { procesarRubrosCalculados } from "../lib/procesar-rubros-calculados";

import type { Id } from "../lib/tipos";

type Props = {
  rubros?: RubroCalculo[];

  entidadSeleccionadaId?: Id | null;

  categoriaSeleccionada?: string | null;

  codRubroFleteSeleccionado?: Id | null;

  codServicioFleteSeleccionado?: Id | null;

  valorCw?: unknown;

  categorias: CatalogoTipo[];

  monedas: MonedaFlete[];

  codTipoTransporte?: Id | null;

  serviciosCatalogo: Array<{
    cod_servicio?: Id | null;

    clasificacion?: Id | null;

    [key: string]: unknown;
  }>;
};

export function useRubrosCalculados(props: Props) {
  return React.useMemo(
    () =>
      procesarRubrosCalculados({
        rubros: props.rubros ?? [],

        entidadSeleccionadaId: props.entidadSeleccionadaId ?? null,

        categoriaSeleccionada: props.categoriaSeleccionada ?? null,

        codRubroFleteSeleccionado: props.codRubroFleteSeleccionado ?? null,

        codServicioFleteSeleccionado: props.codServicioFleteSeleccionado ?? null,

        valorCw: props.valorCw,

        categorias: props.categorias,

        monedas: props.monedas,

        serviciosCatalogo: props.serviciosCatalogo,

        codTipoTransporte: props.codTipoTransporte ?? null,
      }),
    [props],
  );
}
