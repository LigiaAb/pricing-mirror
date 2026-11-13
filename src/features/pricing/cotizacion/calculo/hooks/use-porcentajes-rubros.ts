import React from "react";
import { calcularTotalDueAgent } from "../lib/due-agent";
import { calcularTotalesDueCarrier } from "../lib/due-carrier";
import { calcularPorcentajesRubros } from "../lib/porcentajes-rubros";
import type { Registro } from "../lib/tipos";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";
import type { useRubrosDueAgent } from "./use-rubros-due-agent";
import type { useRubrosDueCarrier } from "./use-rubros-due-carrier";

type ControllerDueCarrier = ReturnType<typeof useRubrosDueCarrier>;
type ControllerDueAgent = ReturnType<typeof useRubrosDueAgent>;

type Props = {
  dueCarrier: ControllerDueCarrier;
  dueAgent: ControllerDueAgent;
  dueCarrierDesdeAgent: ControllerDueCarrier;
  /** Rutas Scalling aplicadas: solo sirven de base, no se recalculan aquí. */
  rubrosScalling: Registro[];
  lectura: boolean;
};

/**
 * Aplica el método Porcentaje (rubro = % de otro rubro, ver
 * lib/porcentajes-rubros.ts) a Due Carrier, Due Agent y Carrier basado en Agent.
 *
 * El rubro base puede estar en otra sección, por eso se calcula aquí, con todos
 * los rubros aplicados, y no dentro de cada hook. Devuelve los mismos
 * controllers con `rubros` / `seleccionados` y totales actualizados.
 *
 * En lectura no se recalcula: los importes guardados ya vienen calculados.
 */
export function usePorcentajesRubros({
  dueCarrier,
  dueAgent,
  dueCarrierDesdeAgent,
  rubrosScalling,
  lectura,
}: Props) {
  const { monedas } = useCatalogosCotizacion().calculo;

  /*
   * Las dependencias son los arreglos (estables entre renders), no los
   * controllers, que son objetos nuevos en cada render. Si ningún rubro es
   * Porcentaje se devuelven los mismos arreglos.
   */
  const calculado = React.useMemo(() => {
    if (lectura) {
      return {
        carrier: dueCarrier.rubros,
        agent: dueAgent.seleccionados,
        desdeAgent: dueCarrierDesdeAgent.rubros,
      };
    }

    const bases: Registro[] = [
      ...dueCarrier.rubros,
      ...dueAgent.seleccionados,
      ...dueCarrierDesdeAgent.rubros,
      ...rubrosScalling,
    ];

    return {
      carrier: mismoArregloSiNoCambia(
        dueCarrier.rubros,
        calcularPorcentajesRubros(dueCarrier.rubros, bases),
      ),
      agent: mismoArregloSiNoCambia(
        dueAgent.seleccionados,
        calcularPorcentajesRubros(dueAgent.seleccionados, bases),
      ),
      desdeAgent: mismoArregloSiNoCambia(
        dueCarrierDesdeAgent.rubros,
        calcularPorcentajesRubros(dueCarrierDesdeAgent.rubros, bases),
      ),
    };
  }, [
    lectura,
    dueCarrier.rubros,
    dueAgent.seleccionados,
    dueCarrierDesdeAgent.rubros,
    rubrosScalling,
  ]);

  const totalesCarrier = React.useMemo(
    () => totalesDueCarrier(calculado.carrier, dueCarrier.rubros, monedas),
    [calculado.carrier, dueCarrier.rubros, monedas],
  );

  const totalesDesdeAgent = React.useMemo(
    () => totalesDueCarrier(calculado.desdeAgent, dueCarrierDesdeAgent.rubros, monedas),
    [calculado.desdeAgent, dueCarrierDesdeAgent.rubros, monedas],
  );

  const totalDueAgent = React.useMemo(
    () =>
      calculado.agent === dueAgent.seleccionados ? null : calcularTotalDueAgent(calculado.agent),
    [calculado.agent, dueAgent.seleccionados],
  );

  return {
    dueCarrier: totalesCarrier
      ? { ...dueCarrier, rubros: calculado.carrier, ...totalesCarrier }
      : dueCarrier,
    dueAgent:
      totalDueAgent == null
        ? dueAgent
        : { ...dueAgent, seleccionados: calculado.agent, totalDueAgent },
    dueCarrierDesdeAgent: totalesDesdeAgent
      ? { ...dueCarrierDesdeAgent, rubros: calculado.desdeAgent, ...totalesDesdeAgent }
      : dueCarrierDesdeAgent,
  };
}

function mismoArregloSiNoCambia<T>(original: T[], calculado: T[]): T[] {
  return calculado.every((item, index) => item === original[index]) ? original : calculado;
}

/** Totales de Due Carrier solo si el método Porcentaje cambió algún rubro. */
function totalesDueCarrier(
  rubros: ControllerDueCarrier["rubros"],
  original: ControllerDueCarrier["rubros"],
  monedas: Parameters<typeof calcularTotalesDueCarrier>[0]["monedas"],
) {
  if (rubros === original) return null;
  const totalPorMoneda = calcularTotalesDueCarrier({ rubros, monedas });
  const total = Object.values(totalPorMoneda).reduce(
    (acumulado, item) => acumulado + item.total,
    0,
  );
  return { totalPorMoneda, total };
}
