import React from "react";
import {
  calcularTotalesDueCarrier,
  esDueCarrierManual,
  procesarRubrosDueCarrier,
  type RubroDueCarrier,
  type ValoresManualDueCarrier,
} from "../lib/due-carrier";
import {
  calcularCoberturaMercaderia,
  calcularVentaCostoPorcentaje,
  claveValorFactura,
  esCoberturaMercaderia,
  esMetodoCostoPorcentaje,
} from "../lib/rubros-manuales";
import { limpiarNumero } from "../lib/utils";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Props = {
  rubros: RubroDueCarrier[];

  lectura?: boolean;

  onRubrosProcesados?: (rubros: RubroDueCarrier[]) => void;

  onValoresManualChange?: (valores: ValoresManualDueCarrier) => void;

  /**
   * `valor_flete` de los criterios (flete del carrier seleccionado).
   * Lo usa la cobertura de mercadería.
   */
  valorFlete?: string | number | null;

  /** Valor de factura escrito en una cobertura (se guarda en criterioCobertura). */
  onValorFacturaChange?: (value: number) => void;

  /**
   * Costo escrito en el flete (normal) Costo por porcentaje: recibe la venta
   * calculada (`null` si se vació) para usarla como valor_flete y recalcular.
   */
  onVentaFleteCostoPorcentajeChange?: (venta: number | null) => void;
};

export function useRubrosDueCarrier({
  rubros,
  lectura = false,
  onRubrosProcesados,
  onValoresManualChange,
  valorFlete = 0,
  onValorFacturaChange,
  onVentaFleteCostoPorcentajeChange,
}: Props) {
  const { monedas } = useCatalogosCotizacion().calculo;

  const [valoresManual, setValoresManual] = React.useState<ValoresManualDueCarrier>({});

  /*
   * ===========================================
   * LIMPIAR VALORES QUE YA NO EXISTEN
   * ===========================================
   *
   * Importante para Carrier:
   * evita que un abierto de una consulta
   * anterior siga contaminando una nueva
   * respuesta.
   */
  /*
   * La limpieza depende únicamente de qué `value` existen.
   *
   * `rubros` puede reconstruirse en el padre con una referencia nueva en
   * cada render aunque contenga exactamente los mismos elementos. Si usamos
   * el array directamente como dependencia, el effect vuelve a llamar a
   * setValoresManual() indefinidamente.
   */
  const firmaRubros = React.useMemo(
    () =>
      rubros
        .map((item) => String(item.value ?? ""))
        .filter(Boolean)
        .sort()
        .join("|"),
    [rubros],
  );

  React.useEffect(() => {
    setValoresManual((prev) => {
      const valuesActuales = new Set(firmaRubros ? firmaRubros.split("|") : []);

      // El valor de factura de una cobertura vive en su propia llave.
      for (const value of [...valuesActuales]) valuesActuales.add(claveValorFactura(value));

      const keysActuales = Object.keys(prev);
      const hayObsoletos = keysActuales.some((key) => !valuesActuales.has(key));

      /*
       * No construir un objeto nuevo si no hay nada que limpiar.
       */
      if (!hayObsoletos) {
        return prev;
      }

      return Object.fromEntries(Object.entries(prev).filter(([key]) => valuesActuales.has(key)));
    });
  }, [firmaRubros]);

  /* ===========================================
   * RUBROS PROCESADOS
   * =========================================== */

  const rubrosProcesados = React.useMemo(
    () =>
      procesarRubrosDueCarrier({
        rubros,

        valores: valoresManual,

        lectura,

        monedas,
      }),
    [rubros, valoresManual, lectura, monedas],
  );

  /* ===========================================
   * TOTAL
   * =========================================== */

  const totalPorMoneda = React.useMemo(
    () =>
      calcularTotalesDueCarrier({
        rubros: rubrosProcesados,

        monedas,
      }),
    [rubrosProcesados, monedas],
  );

  const total = React.useMemo(
    () => Object.values(totalPorMoneda).reduce((acumulado, item) => acumulado + item.total, 0),
    [totalPorMoneda],
  );

  /* ===========================================
   * MANUAL
   * =========================================== */

  const cambiarValorManual = React.useCallback(
    (
      item: RubroDueCarrier,

      raw: string,
    ) => {
      if (!esDueCarrierManual(item)) {
        return;
      }

      /*
       * Mismo sanitizado actual.
       */
      const valor = limpiarNumero(raw);

      setValoresManual((prev) => ({
        ...prev,

        [String(item.value)]: valor,
      }));

      if (item.es_flete === true && !item.es_tarifa_spot && esMetodoCostoPorcentaje(item)) {
        onVentaFleteCostoPorcentajeChange?.(
          valor === "" ? null : calcularVentaCostoPorcentaje(item, valor).venta,
        );
      }
    },
    [onVentaFleteCostoPorcentajeChange],
  );

  /*
   * Cobertura: el usuario escribe el valor de factura y la venta
   * se calcula con el flete del carrier seleccionado (igual que Due Agent).
   */
  const cambiarValorFactura = React.useCallback(
    (item: RubroDueCarrier, raw: string) => {
      if (!esCoberturaMercaderia(item)) {
        return;
      }

      const value = limpiarNumero(raw);

      const factura = Number(value);

      const calculado = calcularCoberturaMercaderia({
        item,

        valorFactura: factura,

        valorFlete,
      });

      setValoresManual((prev) => ({
        ...prev,

        [String(item.value)]: calculado,

        [claveValorFactura(item.value)]: value,
      }));

      onValorFacturaChange?.(factura);
    },
    [valorFlete, onValorFacturaChange],
  );

  /* ===========================================
   * NOTIFICACIONES
   * =========================================== */

  React.useEffect(() => {
    onValoresManualChange?.(valoresManual);
  }, [valoresManual, onValoresManualChange]);

  React.useEffect(() => {
    onRubrosProcesados?.(rubrosProcesados);
  }, [rubrosProcesados, onRubrosProcesados]);

  return {
    rubros: rubrosProcesados,

    valoresManual,

    totalPorMoneda,

    total,

    cambiarValorManual,

    cambiarValorFactura,
  };
}
