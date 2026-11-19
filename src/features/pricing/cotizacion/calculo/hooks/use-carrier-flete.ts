"use client";

import React from "react";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import {
  type CarrierOption,
  construirCriteriosCarrier,
  construirOpcionesCarrier,
  crearTarifaSpotDueCarrier,
  obtenerServicioFleteSeleccionado,
  type RubroFlete,
} from "../lib/carrier-flete";

import type { Id } from "../lib/tipos";
import { crearKeyCriterios, getSimboloMoneda } from "../lib/utils";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

/** Pausa (ms) tras la última tecla en el costo de un flete Costo por porcentaje antes de recalcular. */
export const DEMORA_RECALCULO_COSTO_FLETE = 800;

/**
 * Venta calculada del flete Costo por porcentaje que espera el debounce.
 * Es un objeto para que escribir el mismo valor otra vez también recalcule.
 */
type VentaFletePendiente = { venta: number | null };

type Props = {
  fletes: RubroFlete[];

  criterios: Record<string, unknown>;

  /*
   * Se usa solamente para construir
   * la key de deduplicación del cálculo.
   */
  criteriosParaFlete: Record<string, unknown>;

  plantillaId?: Id | null;

  carrierPlantillaId?: Id | null;

  codTipoPago?: Id | null;

  /** Define el texto del detalle del flete Spot (ver lib/detalle-flete.ts). */
  codTipoTransporte?: Id | null;

  valorCw?: unknown;

  /*
   * Sirve para recuperar primero el
   * Carrier de una versión guardada.
   */
  entidadIdGuardadaEnVersion?: Id | null;

  /*
   * Fallback del Grid actual.
   */
  cotizacionEntidadId?: Id | null;

  isReadOnly?: boolean;

  /*
   * Limpia resultados calculados,
   * pero NO los fletes disponibles.
   */
  onLimpiarResultados?: () => void;

  /*
   * El hook no conoce el endpoint.
   *
   * El caller normalmente hará:
   *
   * setCriterios(next);
   * calcularCotizacion({
   *   criteriosCalculo: next
   * });
   */
  onRecalcular: (
    criterios: Record<string, unknown>,
    carrier: CarrierOption,
  ) => Promise<unknown> | unknown;
};

export function useCarrierFlete({
  fletes,
  criterios,
  criteriosParaFlete,
  plantillaId,
  carrierPlantillaId,
  codTipoPago,
  codTipoTransporte,
  valorCw,
  entidadIdGuardadaEnVersion,
  cotizacionEntidadId,
  isReadOnly = false,
  onLimpiarResultados = () => {},
  onRecalcular,
}: Props) {
  const { categoriasTransporte: categorias, tipos, monedas } = useCatalogosCotizacion().calculo;

  /* ==========================================================
   * ESTADO
   * ========================================================== */

  const [carrierSeleccionado, setCarrierSeleccionado] = React.useState<CarrierOption | null>(null);

  const [valorFleteManual, setValorFleteManual] = React.useState<number | null>(null);

  const [tarifasSpot, setTarifasSpot] = React.useState<RubroFlete[]>([]);

  const [recalculoToken, setRecalculoToken] = React.useState(0);

  const [ventaFletePendiente, setVentaFletePendiente] = React.useState<VentaFletePendiente | null>(
    null,
  );

  /*
   * Archivo que respalda el costo de un flete Costo por porcentaje.
   * TODO: aún no hay estructura en el backend; se pide, pero no se envía.
   */
  const [archivoCostoFlete, setArchivoCostoFlete] = React.useState<File | null>(null);

  /*
   * Sustituye tarifaReqKeyRef
   * del Grid.
   */
  const ultimaTarifaKeyRef = React.useRef("");

  /* ==========================================================
   * OPCIONES
   * ========================================================== */

  const opcionesCarrier = React.useMemo(
    () =>
      construirOpcionesCarrier({
        fletes,

        carrierPlantillaId: carrierPlantillaId ?? null,

        categorias,
        tipos,
        monedas,
      }),
    [fletes, carrierPlantillaId, categorias, tipos, monedas],
  );

  /* ==========================================================
   * DATOS DERIVADOS
   * ========================================================== */

  const entidadSeleccionadaId = carrierSeleccionado?.entidad_id ?? null;

  const codRubroFleteSeleccionado = carrierSeleccionado?.cod_rubro ?? null;

  const codServicioFleteSeleccionado = carrierSeleccionado?.cod_servicio ?? null;

  const categoriaSeleccionada = carrierSeleccionado?.categoria_transporte ?? null;

  const fleteSeleccionado = carrierSeleccionado?.flete ?? null;

  const servicioSeleccionado = React.useMemo(
    () =>
      obtenerServicioFleteSeleccionado({
        fletes,
        carrier: carrierSeleccionado,
      }),
    [fletes, carrierSeleccionado],
  );

  /* ==========================================================
   * AJUSTAR CARRIER CUANDO CAMBIAN OPTIONS
   * ========================================================== */

  React.useEffect(() => {
    /*
     * Igual al efecto B actual.
     */
    if (isReadOnly) {
      return;
    }

    if (!opcionesCarrier.length) {
      if (carrierSeleccionado) {
        setCarrierSeleccionado(null);

        onLimpiarResultados();
      }

      return;
    }

    /*
     * La opción seleccionada sigue
     * existiendo exactamente.
     *
     * No tocarla.
     */
    if (
      carrierSeleccionado?.value &&
      opcionesCarrier.some((option) => String(option.value) === String(carrierSeleccionado.value))
    ) {
      return;
    }

    /*
     * Prioridad actual:
     *
     * 1. entidad guardada en versión
     * 2. entidad de cotización
     * 3. primera opción
     */
    const targetId = entidadIdGuardadaEnVersion ?? cotizacionEntidadId ?? null;

    const opcionTarget =
      targetId == null
        ? null
        : opcionesCarrier.find((option) => String(option.entidad_id) === String(targetId));

    const siguiente = opcionTarget ?? opcionesCarrier[0] ?? null;

    if (siguiente?.value && String(siguiente.value) === String(carrierSeleccionado?.value)) {
      return;
    }

    setCarrierSeleccionado(siguiente);

    onLimpiarResultados();
  }, [
    isReadOnly,
    opcionesCarrier,
    carrierSeleccionado,
    entidadIdGuardadaEnVersion,
    cotizacionEntidadId,
    onLimpiarResultados,
  ]);

  /*
   * Este es el mismo comportamiento del
   * efecto B del Grid:
   *
   * mantiene Carrier si value aún existe,
   * intenta recuperar la entidad guardada,
   * si no usa entidad de cotización,
   * y finalmente options[0].
   */

  /* ==========================================================
   * SELECCIÓN MANUAL DE CARRIER
   * ========================================================== */

  const seleccionarCarrier = React.useCallback(
    (carrier?: CarrierOption | null) => {
      /*
       * El código actual limpia SPOT
       * y valor manual al cambiar Carrier.
       */
      setValorFleteManual(null);

      setTarifasSpot([]);

      setVentaFletePendiente(null);

      setArchivoCostoFlete(null);

      setCarrierSeleccionado(carrier ?? opcionesCarrier[0] ?? null);
    },
    [opcionesCarrier],
  );

  /* ==========================================================
   * FLETE MANUAL
   * ========================================================== */

  const cambiarFleteManual = React.useCallback((raw: string | number | null | undefined) => {
    if (raw == null || String(raw).trim() === "") {
      setValorFleteManual(null);

      setRecalculoToken((prev) => prev + 1);

      return;
    }

    const valor = Number(raw);

    /*
     * IMPORTANTE:
     * Se conserva el comportamiento actual
     * del Grid legado: si Number(raw) produce
     * NaN, ese valor se guarda y se retorna
     * sin incrementar el token.
     *
     * Es un posible bug del legado, pero no
     * se corrige silenciosamente aquí.
     */
    if (!Number.isFinite(valor)) {
      setValorFleteManual(valor);

      return;
    }

    setValorFleteManual(valor);

    setRecalculoToken((prev) => prev + 1);
  }, []);

  /* ==========================================================
   * FLETE COSTO POR PORCENTAJE
   * ==========================================================
   *
   * El usuario escribe el costo del flete en Due Carrier; la venta
   * calculada pasa a ser el valor_flete y se vuelve a calcular
   * (Due Carrier y Due Agent) cuando deja de escribir.
   */

  const cambiarVentaFleteCostoPorcentaje = React.useCallback((venta: number | null) => {
    setVentaFletePendiente({ venta });
  }, []);

  const ventaFleteDiferida = useDebouncedValue(ventaFletePendiente, DEMORA_RECALCULO_COSTO_FLETE);

  React.useEffect(() => {
    if (ventaFleteDiferida == null) {
      return;
    }

    cambiarFleteManual(ventaFleteDiferida.venta);
  }, [ventaFleteDiferida, cambiarFleteManual]);

  /* ==========================================================
   * SPOT
   * ========================================================== */

  const agregarSpot = React.useCallback(
    ({
      rubroBase,
      valorSpot,
      rateValor,
    }: {
      rubroBase: RubroFlete | null | undefined;

      valorSpot: string | number | null;

      rateValor?: string | number | null;
    }) => {
      if (!rubroBase) {
        return null;
      }

      const metodo = rubroBase.servicio?.metodo ?? rubroBase.metodo;

      const simbolo = getSimboloMoneda(monedas, metodo?.cod_moneda_venta as Id | null | undefined);

      const spot = crearTarifaSpotDueCarrier({
        rubroBase,
        valorSpot,
        rateValor: rateValor ?? null,
        valorCw,
        codTipoPago: codTipoPago ?? null,
        moneda: simbolo,
        codTipoTransporte: codTipoTransporte ?? null,
      });

      if (!spot) {
        return null;
      }

      /*
       * Solo puede existir un SPOT
       * activo.
       */
      setTarifasSpot((prev) => [spot, ...prev.filter((item) => !item.es_tarifa_spot)]);

      /*
       * El código actual después de
       * agregar SPOT también fuerza
       * el nuevo flete al Carrier.
       */
      cambiarFleteManual(valorSpot);

      return spot;
    },
    [monedas, valorCw, codTipoPago, codTipoTransporte, cambiarFleteManual],
  );

  const quitarSpot = React.useCallback(() => {
    setTarifasSpot((prev) => prev.filter((item) => !item.es_tarifa_spot));
  }, []);

  /* ==========================================================
   * KEY DEL RECÁLCULO
   * ========================================================== */

  const criteriosParaFleteKey = React.useMemo(
    () => crearKeyCriterios(criteriosParaFlete),
    [criteriosParaFlete],
  );

  /* ==========================================================
   * RECALCULAR CUANDO CAMBIA CARRIER / FLETE
   * ========================================================== */

  React.useEffect(() => {
    if (isReadOnly) {
      return;
    }

    if (plantillaId == null) {
      return;
    }

    if (!Object.keys(criteriosParaFlete).length) {
      return;
    }

    if (!carrierSeleccionado) {
      return;
    }

    if (!fletes.length) {
      return;
    }

    if (!servicioSeleccionado) {
      return;
    }

    const next = construirCriteriosCarrier({
      criterios,

      carrier: carrierSeleccionado,

      servicio: servicioSeleccionado,

      valorManual: valorFleteManual,
    });

    if (!next) {
      return;
    }

    const nuevoValor = next.valor_flete;

    /*
     * Conserva la key utilizada por
     * el efecto C del Grid:
     *
     * plantilla
     * criterios
     * option
     * servicio
     * valor
     * categoría
     * token
     */
    const tarifaKey = [
      plantillaId,

      criteriosParaFleteKey,

      carrierSeleccionado.value,

      servicioSeleccionado.cod_servicio ?? "",

      nuevoValor ?? "",

      servicioSeleccionado.categoria_transporte ?? "",

      recalculoToken,
    ].join("__");

    if (ultimaTarifaKeyRef.current === tarifaKey) {
      return;
    }

    ultimaTarifaKeyRef.current = tarifaKey;

    void onRecalcular(next, carrierSeleccionado);
  }, [
    isReadOnly,
    plantillaId,
    criteriosParaFleteKey,
    criteriosParaFlete,
    carrierSeleccionado,
    servicioSeleccionado,
    fletes,
    criterios,
    valorFleteManual,
    recalculoToken,
    onRecalcular,
  ]);

  /*
   * Esta es la sustitución directa
   * del efecto C.
   *
   * Actualmente ese efecto obtiene
   * servicio, valor manual/flete,
   * categoría, arma una tarifaKey y
   * llama consultarCalcuo(next).
   */

  /* ==========================================================
   * CONTROL
   * ========================================================== */

  const forzarRecalculo = React.useCallback(() => {
    ultimaTarifaKeyRef.current = "";

    setRecalculoToken((prev) => prev + 1);
  }, []);

  const limpiarCarrier = React.useCallback(() => {
    setCarrierSeleccionado(null);

    setValorFleteManual(null);

    setTarifasSpot([]);

    setVentaFletePendiente(null);

    setArchivoCostoFlete(null);

    ultimaTarifaKeyRef.current = "";

    setRecalculoToken(0);
  }, []);

  /*
   * Para restaurar una opción concreta
   * desde un flujo de lectura/carga.
   */
  const establecerCarrier = React.useCallback((carrier: CarrierOption | null) => {
    setCarrierSeleccionado(carrier);
  }, []);

  return {
    /* Options */

    opcionesCarrier,

    /* Selección */

    carrierSeleccionado,

    entidadSeleccionadaId,

    codRubroFleteSeleccionado,

    codServicioFleteSeleccionado,

    categoriaSeleccionada,

    fleteSeleccionado,

    servicioSeleccionado,

    /* Manual */

    valorFleteManual,

    /* SPOT */

    tarifasSpot,

    /* Flete Costo por porcentaje */

    archivoCostoFlete,

    /* Acciones */

    seleccionarCarrier,

    establecerCarrier,

    cambiarFleteManual,

    cambiarVentaFleteCostoPorcentaje,

    setArchivoCostoFlete,

    agregarSpot,

    quitarSpot,

    forzarRecalculo,

    limpiarCarrier,
  };
}
