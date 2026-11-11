import React from "react";
import {
  calcularTotalesDueCarrier,
  esDueCarrierManual,
  procesarRubrosDueCarrier,
  type RubroDueCarrier,
  type ValoresManualDueCarrier,
} from "../lib/due-carrier";
import { limpiarNumero } from "../lib/utils";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Props = {
  rubros: RubroDueCarrier[];

  lectura?: boolean;

  onRubrosProcesados?: (rubros: RubroDueCarrier[]) => void;

  onValoresManualChange?: (valores: ValoresManualDueCarrier) => void;
};

export function useRubrosDueCarrier({
  rubros,
  lectura = false,
  onRubrosProcesados,
  onValoresManualChange,
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
      }),
    [rubros, valoresManual, lectura],
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
    },
    [],
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
  };
}
