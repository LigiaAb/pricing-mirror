"use client";

import React from "react";
import {
  agregarEstadoBloqueado,
  aplicarValoresManualDueAgent,
  calcularCoberturaMercaderia,
  calcularTotalDueAgent,
  obtenerAutoSeleccionObligatorios,
  obtenerObligatoriosPendientes,
  type RubroDueAgent,
  type ValoresManualDueAgent,
} from "../lib/due-agent";

import type { Id } from "../lib/tipos";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

const EMPTY_SERVICIOS_AUTOSELECCION: Id[] = [];

/**
 * Firma únicamente de los datos que afectan la sincronización de selección.
 *
 * `rubros` puede reconstruirse en el padre en cada render. No podemos usar
 * solamente la referencia del array para decidir si hay que volver a hacer
 * setSeleccionados().
 */
function crearFirmaRubros(rubros: RubroDueAgent[], lectura: boolean) {
  return JSON.stringify(
    rubros.map((item) => [
      item.value ?? null,
      item.cod_rubro ?? null,
      item.cod_servicio ?? item.servicio?.cod_servicio ?? null,

      item.es_obligatorio ?? null,
      item.servicio?.es_obligatorio ?? null,
      item.servicio?.servicio_obligatorio ?? null,

      /*
       * En lectura también importan los valores persistidos. Si cambia una
       * versión guardada con el mismo `value`, sí debemos resincronizar.
       */
      lectura ? (item.servicio?.metodo?.venta ?? null) : null,
      lectura ? (item.servicio?.metodo?.costo ?? null) : null,
      lectura ? (item.servicio?.metodo?.cod_moneda_venta ?? null) : null,
      lectura ? (item.servicio?.metodo?.cod_moneda_costo ?? null) : null,
    ]),
  );
}

function crearFirmaServicios(servicios: Id[]) {
  return servicios.map(String).sort().join("|");
}

type Props = {
  rubros: RubroDueAgent[];

  lectura?: boolean;

  serviciosAutoSeleccion?: Id[];

  codMonedaPadre?: Id | null;

  valorFlete?: string | number | null;

  /*
   * Due Carrier dependiente.
   */
  entidadSeleccionadaId?: Id | null;

  onCalcularDueCarrier: (totalDueAgent: number) => Promise<unknown> | unknown;

  onLimpiarDueCarrier?: () => void;

  /**
   * Firma semántica del contexto que modifica el cálculo dependiente
   * (criterios + filtros). Permite recalcular aunque el total no cambie,
   * sin depender de la identidad de callbacks/objetos React.
   */
  dueCarrierContextKey?: string;

  /*
   * Solo existe recálculo basado en total Due Agent cuando alguno
   * de los servicios requiere ese tipo de cálculo.
   */
  requiereRecalculoDueCarrier?: boolean;

  /*
   * Cobertura de mercadería
   * actualmente escribe valor_factura
   * en criterios.
   */
  onValorFacturaChange?: (value: number) => void;
};

export function useRubrosDueAgent({
  rubros,
  lectura = false,
  serviciosAutoSeleccion = EMPTY_SERVICIOS_AUTOSELECCION,
  codMonedaPadre,
  valorFlete = 0,
  entidadSeleccionadaId,
  onCalcularDueCarrier,
  onLimpiarDueCarrier,
  dueCarrierContextKey = "",
  requiereRecalculoDueCarrier = false,
  onValorFacturaChange,
}: Props) {
  const { monedas } = useCatalogosCotizacion().calculo;

  const [seleccionados, setSeleccionados] = React.useState<RubroDueAgent[]>([]);

  const [valoresManual, setValoresManual] = React.useState<ValoresManualDueAgent>({});

  /*
   * =====================================
   * SINCRONIZACIÓN
   * =====================================
   */

  const firmaRubros = crearFirmaRubros(rubros, lectura);
  const firmaServiciosAuto = crearFirmaServicios(serviciosAutoSeleccion);

  /*
   * React puede ejecutar el effect otra vez si el padre reconstruye `rubros`
   * con otra referencia. Esta ref impide volver a escribir estado cuando el
   * contenido lógico es exactamente el mismo.
   */
  const ultimaFirmaSincronizadaRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const firmaActual = `${lectura ? "L" : "E"}::${firmaRubros}::${firmaServiciosAuto}`;

    if (ultimaFirmaSincronizadaRef.current === firmaActual) {
      return;
    }

    /*
     * Marcamos la firma ANTES del setState. Así el render provocado por
     * setSeleccionados no puede volver a entrar en el mismo ciclo.
     */
    ultimaFirmaSincronizadaRef.current = firmaActual;

    /*
     * En lectura los rubros ya vienen seleccionados desde BD.
     */
    if (lectura) {
      setSeleccionados(rubros);
      return;
    }

    setSeleccionados((prev) => {
      /*
       * Conservar únicamente selección que todavía exista.
       */
      const prevVigentes = prev.filter((seleccionado) =>
        rubros.some((item) => item.value === seleccionado.value),
      );

      const rubrosYaSeleccionados = new Set(
        prevVigentes.map((item) => String(item.cod_rubro ?? "")),
      );

      /*
       * Obligatorio único:
       * automático e inamovible.
       */
      const automaticos = obtenerAutoSeleccionObligatorios(rubros)
        .filter((item) => !rubrosYaSeleccionados.has(String(item.cod_rubro ?? "")))
        .map((item) => ({
          ...item,
          quitarBoton: true,
        }));

      const serviciosSet = new Set(serviciosAutoSeleccion.map(String));

      /*
       * Servicios de plantilla:
       * también se autoseleccionan,
       * pero sí se pueden quitar.
       */
      const plantilla = rubros
        .filter((item) => {
          const codServicio = String(item.servicio?.cod_servicio ?? item.cod_servicio ?? "");

          return (
            serviciosSet.has(codServicio) &&
            !prevVigentes.some((actual) => actual.value === item.value) &&
            !automaticos.some((actual) => actual.value === item.value)
          );
        })
        .map((item) => ({
          ...item,
          quitarBoton: false,
        }));

      const resultado = [...prevVigentes, ...automaticos, ...plantilla];

      const vistos = new Set<string>();

      return resultado.filter((item) => {
        if (!item.value || vistos.has(item.value)) {
          return false;
        }

        vistos.add(item.value);

        return true;
      });
    });
  }, [lectura, rubros, serviciosAutoSeleccion, firmaRubros, firmaServiciosAuto]);
  /* =====================================
   * BLOQUEADOS / VALIDACIÓN
   * =====================================
   */

  const rubrosConEstado = React.useMemo(
    () =>
      agregarEstadoBloqueado({
        items: rubros,
        seleccionados,
      }),
    [rubros, seleccionados],
  );

  const obligatoriosPendientes = React.useMemo(
    () =>
      obtenerObligatoriosPendientes({
        items: rubros,
        seleccionados,
      }),
    [rubros, seleccionados],
  );

  const isValid = obligatoriosPendientes.length === 0;

  /* =====================================
   * SELECCIÓN
   * =====================================
   */

  const toggleRubro = React.useCallback(
    (item: RubroDueAgent) => {
      const actual = rubrosConEstado.find((rubro) => rubro.value === item.value) ?? item;

      const estaSeleccionado = seleccionados.some(
        (seleccionado) => seleccionado.value === actual.value,
      );

      if (!estaSeleccionado) {
        if (actual.blocked) {
          return;
        }

        setSeleccionados((prev) => [...prev, actual]);

        return;
      }

      /*
       * Obligatorios automáticos
       * no pueden quitarse.
       */
      const seleccionado = seleccionados.find((value) => value.value === actual.value);

      if (seleccionado?.quitarBoton === true) {
        return;
      }

      setSeleccionados((prev) => prev.filter((value) => value.value !== actual.value));
    },
    [rubrosConEstado, seleccionados],
  );

  /* =====================================
   * MANUALES
   * =====================================
   */

  const cambiarValorManual = React.useCallback((item: RubroDueAgent, raw: string) => {
    const value = String(raw ?? "").replace(/[^0-9.]/g, "");

    setValoresManual((prev) => ({
      ...prev,

      [item.value]: value,
    }));
  }, []);

  const cambiarValorFactura = React.useCallback(
    (item: RubroDueAgent, raw: string) => {
      const value = String(raw ?? "").replace(/[^0-9.]/g, "");

      const factura = Number(value);

      const calculado = calcularCoberturaMercaderia({
        item,

        valorFactura: factura,

        valorFlete,
      });

      setValoresManual((prev) => ({
        ...prev,

        [item.value]: calculado,

        [`${item.value}_a_calcular`]: value,
      }));

      onValorFacturaChange?.(factura);
    },
    [valorFlete, onValorFacturaChange],
  );

  /* =====================================
   * RUBROS FINALES
   * =====================================
   */

  const rubrosSeleccionados = React.useMemo(() => {
    /*
     * En lectura, useRubrosCotizacion ya entrega
     * rubros reconstruidos desde la versión guardada.
     * No debemos volver a aplicar los valores manuales,
     * porque valoresManual inicia vacío y eso reemplazaría
     * la venta/costo persistidos por 0.
     */
    if (lectura) {
      return seleccionados;
    }

    return aplicarValoresManualDueAgent({
      seleccionados,

      valores: valoresManual,

      codMonedaPadre: codMonedaPadre ?? null,

      monedas,
    });
  }, [lectura, seleccionados, valoresManual, codMonedaPadre, monedas]);

  const totalDueAgent = React.useMemo(
    () => calcularTotalDueAgent(rubrosSeleccionados),
    [rubrosSeleccionados],
  );

  /* =====================================
   * DUE CARRIER BASADO EN DUE AGENT
   * =====================================
   */

  /*
   * Los callbacks vienen del orquestador y pueden cambiar de referencia
   * aunque su comportamiento sea el mismo. Guardamos siempre la versión
   * más reciente sin convertir esa identidad en una dependencia del effect.
   */
  const onCalcularDueCarrierRef = React.useRef(onCalcularDueCarrier);
  const onLimpiarDueCarrierRef = React.useRef(onLimpiarDueCarrier);

  React.useEffect(() => {
    onCalcularDueCarrierRef.current = onCalcularDueCarrier;
  }, [onCalcularDueCarrier]);

  React.useEffect(() => {
    onLimpiarDueCarrierRef.current = onLimpiarDueCarrier;
  }, [onLimpiarDueCarrier]);

  const ultimaKeyDueCarrierRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lectura || entidadSeleccionadaId == null) {
      return;
    }

    const total = Number(totalDueAgent) || 0;

    const key = [
      String(entidadSeleccionadaId),
      String(total),
      requiereRecalculoDueCarrier ? "1" : "0",
      dueCarrierContextKey,
    ].join("__");

    /*
     * El mismo estado lógico no debe volver a disparar limpieza/cálculo
     * solamente porque ocurrió otro render.
     */
    if (ultimaKeyDueCarrierRef.current === key) {
      return;
    }

    ultimaKeyDueCarrierRef.current = key;

    /*
     * Regla funcional:
     *
     * El total Due Agent solo debe provocar otra consulta de tarifa
     * cuando existe al menos un servicio cuyo:
     *
     * - cod_tipo = 90
     *   o
     * - cod_tipo_calculo = 90
     *
     * Si no existe, el total Due Agent no alimenta ningún cálculo
     * dependiente y por lo tanto NO se consulta /calcular-tarifa.
     */
    if (!requiereRecalculoDueCarrier) {
      onLimpiarDueCarrierRef.current?.();
      return;
    }

    if (total <= 0) {
      onLimpiarDueCarrierRef.current?.();
      return;
    }

    const timer = window.setTimeout(() => {
      void onCalcularDueCarrierRef.current(total);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    lectura,
    entidadSeleccionadaId,
    totalDueAgent,
    requiereRecalculoDueCarrier,
    dueCarrierContextKey,
  ]);

  return {
    rubros: rubrosConEstado,

    seleccionados: rubrosSeleccionados,

    valoresManual,

    obligatoriosPendientes,

    isValid,

    totalDueAgent,

    toggleRubro,

    cambiarValorManual,

    cambiarValorFactura,
  };
}
