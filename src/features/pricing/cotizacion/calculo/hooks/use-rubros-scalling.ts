"use client";

import React from "react";

import { useRutasScalling } from "../api/scalling";

import { TIPOS_TRANSPORTE } from "../lib/calculadora-medidas";

import {
  construirLegsScalling,
  type LegScalling,
  moverPuntoScalling,
  obtenerPuntosScallingPosibles,
  type PuntoEnlaceScalling,
  procesarRutasScalling,
  type RubroScalling,
  sincronizarOrdenPuntos,
  sonLegsScallingIguales,
  TIPO_PUNTO_POR_TRANSPORTE,
  type TipoTransporteScalling,
  togglePuntoScalling,
} from "../lib/scalling";

import type { Id } from "../lib/tipos";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Props = {
  rubros: RubroScalling[];

  tipoTransporte?: string | null;

  codTipoTransporte?: Id | null;

  codPuntoOrigen?: Id | null;

  codPuntoDestino?: Id | null;

  entidadId?: Id | null;

  codCotizacionDetalle?: Id | null;

  lectura?: boolean;

  legs?: LegScalling[];

  onLegsChange?: (legs: LegScalling[]) => void;

  onCalcularScalling: (criterios: { lista_paises: string[] }) => Promise<unknown> | unknown;

  /**
   * Firma semántica del resto del cálculo (criterios + filtros).
   *
   * Evita depender de la identidad de onCalcularScalling, pero permite
   * recalcular Scalling cuando cambian realmente los criterios del cálculo.
   */
  calculoContextKey?: string;
};

function resolverTipoTransporte({
  tipoTransporte,
  codTipoTransporte,
}: {
  tipoTransporte?: string | null;
  codTipoTransporte?: Id | null;
}): TipoTransporteScalling | null {
  const normalizado = String(tipoTransporte ?? "")
    .trim()
    .toUpperCase();

  if (normalizado in TIPO_PUNTO_POR_TRANSPORTE) {
    return normalizado as TipoTransporteScalling;
  }

  return TIPOS_TRANSPORTE[Number(codTipoTransporte) as keyof typeof TIPOS_TRANSPORTE] ?? null;
}

function sonPuntosIguales(a: PuntoEnlaceScalling[], b: PuntoEnlaceScalling[]) {
  if (a === b) {
    return true;
  }

  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => item.value === b[index]?.value);
}

export function useRubrosScalling({
  rubros,
  tipoTransporte,
  codTipoTransporte,
  codPuntoOrigen,
  codPuntoDestino,
  entidadId,
  codCotizacionDetalle,
  lectura = false,
  legs = [],
  onLegsChange,
  onCalcularScalling,
  calculoContextKey = "",
}: Props) {
  const { puntosEnlace, monedas } = useCatalogosCotizacion().calculo;

  const {
    data: rutasDisponibles = [],

    isLoading: isLoadingRutas,
  } = useRutasScalling(lectura ? null : entidadId);

  const [puntoSeleccionado, setPuntoSeleccionado] = React.useState<PuntoEnlaceScalling | null>(
    null,
  );

  const [puntosSeleccionados, setPuntosSeleccionados] = React.useState<PuntoEnlaceScalling[]>([]);

  const [puntosOrdenados, setPuntosOrdenados] = React.useState<PuntoEnlaceScalling[]>([]);

  /* =========================================================
   * TRANSPORTE
   * ======================================================= */

  const tipoTransporteEfectivo = React.useMemo(
    () =>
      resolverTipoTransporte({
        tipoTransporte: tipoTransporte ?? null,
        codTipoTransporte: codTipoTransporte ?? null,
      }),
    [tipoTransporte, codTipoTransporte],
  );

  /* =========================================================
   * POSIBLES
   * ======================================================= */

  const puntosPosibles = React.useMemo(
    () =>
      obtenerPuntosScallingPosibles({
        puntos: puntosEnlace,

        rutasDisponibles,

        tipoTransporte: tipoTransporteEfectivo,

        codPuntoOrigen: codPuntoOrigen ?? null,

        codPuntoDestino: codPuntoDestino ?? null,
      }),
    [puntosEnlace, rutasDisponibles, tipoTransporteEfectivo, codPuntoOrigen, codPuntoDestino],
  );

  /* =========================================================
   * RUTAS CALCULADAS
   * ======================================================= */

  const rutasProcesadas = React.useMemo(
    () =>
      procesarRutasScalling({
        rubros,

        lectura,

        legs,

        puntos: puntosEnlace,

        monedas,
      }),
    [rubros, lectura, legs, puntosEnlace, monedas],
  );

  /* =========================================================
   * CÁLCULO SCALLING
   * ======================================================= */

  const listaPaises = React.useMemo(
    () =>
      puntosSeleccionados
        .map((punto) => punto.codigo)
        .filter((codigo): codigo is string => Boolean(codigo)),
    [puntosSeleccionados],
  );

  /*
   * onCalcularScalling viene del orquestador y puede cambiar de referencia
   * después de cada render del cálculo. Si el effect dependiera de esa
   * identidad, una respuesta de calcular-tarifa-scalling provocaría:
   *
   * response -> setValoresCalculados -> render -> callback nuevo
   * -> effect -> request nuevo -> ...
   *
   * Guardamos la versión más reciente en un ref y hacemos que el efecto
   * dependa únicamente del estado lógico que realmente debe recalcular.
   */
  const onCalcularScallingRef = React.useRef(onCalcularScalling);

  React.useEffect(() => {
    onCalcularScallingRef.current = onCalcularScalling;
  }, [onCalcularScalling]);

  const listaPaisesKey = React.useMemo(() => listaPaises.join("|"), [listaPaises]);

  const ultimaKeyScallingRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lectura || entidadId == null) {
      return;
    }

    const key = [
      String(entidadId),
      String(codPuntoOrigen ?? ""),
      String(codPuntoDestino ?? ""),
      listaPaisesKey,
      calculoContextKey,
    ].join("__");

    if (ultimaKeyScallingRef.current === key) {
      return;
    }

    /*
     * La key se guarda ANTES de ejecutar el callback para impedir que el
     * render generado por la propia respuesta vuelva a lanzar el request.
     */
    ultimaKeyScallingRef.current = key;

    /*
     * Comportamiento del legado actual:
     *
     * - listaPuntos inicia vacía;
     * - calcularScalling se ejecuta con [];
     * - luego vuelve a ejecutarse cada vez que el usuario
     *   agrega o quita una parada.
     *
     * No se autoseleccionan todos los puntos disponibles.
     */
    void onCalcularScallingRef.current({
      lista_paises: listaPaises,
    });
  }, [
    lectura,
    entidadId,
    codPuntoOrigen,
    codPuntoDestino,
    listaPaises,
    listaPaisesKey,
    calculoContextKey,
  ]);

  /* =========================================================
   * ORDEN
   * ======================================================= */

  React.useEffect(() => {
    if (lectura) {
      return;
    }

    setPuntosOrdenados((prev) =>
      sincronizarOrdenPuntos({
        seleccionados: puntosSeleccionados,

        ordenActual: prev,
      }),
    );
  }, [lectura, puntosSeleccionados]);

  /* =========================================================
   * LECTURA
   * ======================================================= */

  React.useEffect(() => {
    if (!lectura) {
      return;
    }

    /*
     * Se conserva literalmente la reconstrucción del legado:
     * toma los puntos que aparecen como ORIGEN de algún leg
     * y después elimina el primero con slice(1).
     *
     * Esta regla es sospechosa porque puede ocultar puntos,
     * pero no se corrige silenciosamente durante la migración.
     */
    const nuevaLista = puntosEnlace
      .filter((punto) =>
        legs.some((leg) => leg.cod_puntoenlace_origen === (punto.cod_puntoenlace ?? punto.value)),
      )
      .slice(1);

    setPuntosOrdenados((prev) => (sonPuntosIguales(prev, nuevaLista) ? prev : nuevaLista));
  }, [lectura, puntosEnlace, legs]);

  /* =========================================================
   * LEGS
   * ======================================================= */

  React.useEffect(() => {
    if (lectura) {
      return;
    }

    const nuevosLegs = construirLegsScalling({
      puntosOrdenados,

      rutas: rutasProcesadas,

      puntos: puntosEnlace,

      codCotizacionDetalle: codCotizacionDetalle ?? null,

      codTipoTransporte: codTipoTransporte ?? null,

      entidadId: entidadId ?? null,
    });

    if (sonLegsScallingIguales(legs, nuevosLegs)) {
      return;
    }

    onLegsChange?.(nuevosLegs);
  }, [
    lectura,
    puntosOrdenados,
    rutasProcesadas,
    puntosEnlace,
    codCotizacionDetalle,
    codTipoTransporte,
    entidadId,
    legs,
    onLegsChange,
  ]);

  /* =========================================================
   * ACCIONES
   * ======================================================= */

  const togglePunto = React.useCallback(
    (punto?: PuntoEnlaceScalling | null) => {
      const target = punto ?? puntoSeleccionado;

      if (!target) {
        return;
      }

      setPuntosSeleccionados((prev) =>
        togglePuntoScalling({
          puntos: prev,

          punto: target,
        }),
      );
    },
    [puntoSeleccionado],
  );

  const moverPunto = React.useCallback(
    (
      index: number,

      direccion: "up" | "down",
    ) => {
      setPuntosOrdenados((prev) =>
        moverPuntoScalling({
          puntos: prev,

          index,

          direccion,
        }),
      );
    },
    [],
  );

  const limpiar = React.useCallback(() => {
    setPuntoSeleccionado(null);

    setPuntosSeleccionados([]);

    setPuntosOrdenados([]);
  }, []);

  return {
    /* Datos */

    rutasDisponibles,

    rutasProcesadas,

    puntosPosibles,

    puntosSeleccionados,

    puntosOrdenados,

    puntoSeleccionado,

    /* Loading */

    isLoadingRutas,

    /* Acciones */

    setPuntoSeleccionado,

    togglePunto,

    moverPunto,

    limpiar,
  };
}
