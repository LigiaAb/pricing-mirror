import type { Id } from "./tipos";
import { esTipoPagoPrepaid, getLetraTipoPago, getMetodo } from "./totales-rubros-helpers";
import {
  type ElementoAgrupado,
  type GruposPorRubro,
  IVA_DEFAULT,
  type MonedaTotal,
  type RubroTotal,
  type TipoPagoPorRubro,
  type TotalesPorMoneda,
} from "./totales-rubros-tipos";

/* ==========================================================================
 * TOTAL POR MONEDA + IVA
 * ========================================================================== */

export function calcularTotalesPorMoneda({
  monedas,
  listaElementos,
  rubrosIvaEnCalculo,
  codTipoPago,
  tipoPagoSeleccionado,
  porcentajeIVA = IVA_DEFAULT,
}: {
  monedas: MonedaTotal[];

  listaElementos: RubroTotal[];

  rubrosIvaEnCalculo: RubroTotal[];

  codTipoPago?: Id | null;

  tipoPagoSeleccionado: TipoPagoPorRubro;

  porcentajeIVA?: number;
}): TotalesPorMoneda {
  const letraTipoPagoDefault = getLetraTipoPago(codTipoPago);

  const existeRubroConIVA = listaElementos.some((item) =>
    esTipoPagoPrepaid({
      item,
      codTipoPago: codTipoPago ?? null,
      tipoPagoSeleccionado,
      letraTipoPagoDefault,
    }),
  );

  /*
   * Si el cálculo ya trae un rubro
   * IVA real, usamos su valor.
   */
  const ivaExistentePorMoneda: Record<string, number> = existeRubroConIVA
    ? rubrosIvaEnCalculo.reduce(
        (acc, item) => {
          const metodo = getMetodo(item);

          const codMoneda = metodo?.cod_moneda_venta;

          if (!codMoneda) {
            return acc;
          }

          const key = String(codMoneda);

          acc[key] = Number(acc[key] ?? 0) + Number(metodo?.venta ?? 0);

          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

  /*
   * Total general por moneda.
   */
  const acumulado = listaElementos.reduce((resultado, item) => {
    const metodo = getMetodo(item);

    /*
     * Se conserva fallback 2
     * del código actual.
     */
    const codMoneda = metodo?.cod_moneda_venta ?? 2;

    const moneda = monedas.find((itemMoneda) => itemMoneda.cod_moneda === codMoneda);

    if (!moneda) {
      return resultado;
    }

    const key = String(moneda.cod_moneda);

    const venta = Number(metodo?.venta ?? 0);

    const total = (resultado[key]?.total ?? 0) + venta;

    resultado[key] = {
      total,

      moneda,

      iva: 0,

      totalConIVA: total,
    };

    return resultado;
  }, {} as TotalesPorMoneda);

  /*
   * Base para IVA:
   * solamente rubros PREPAID.
   */
  const acumuladoParaIVA = listaElementos
    .filter((item) =>
      esTipoPagoPrepaid({
        item,
        codTipoPago: codTipoPago ?? null,
        tipoPagoSeleccionado,
        letraTipoPagoDefault,
      }),
    )
    .reduce(
      (resultado, item) => {
        const metodo = getMetodo(item);

        const codMoneda = metodo?.cod_moneda_venta ?? 2;

        const moneda = monedas.find((itemMoneda) => itemMoneda.cod_moneda === codMoneda);

        if (!moneda) {
          return resultado;
        }

        const key = String(moneda.cod_moneda);

        const venta = Number(metodo?.venta ?? 0);

        resultado[key] = (resultado[key] ?? 0) + venta;

        return resultado;
      },
      {} as Record<string, number>,
    );

  for (const key of Object.keys(acumulado)) {
    const totalActual = acumulado[key];

    if (!totalActual) {
      continue;
    }

    const total = totalActual.total;

    const totalParaIVA = acumuladoParaIVA[key] ?? 0;

    const iva = existeRubroConIVA
      ? (ivaExistentePorMoneda[key] ?? totalParaIVA * porcentajeIVA)
      : 0;

    acumulado[key] = {
      ...totalActual,

      iva,

      totalConIVA: total + iva,
    };
  }

  return acumulado;
}
/* ==========================================================================
 * ELEMENTOS AGRUPADOS PARA MOSTRAR
 * ========================================================================== */

export function construirElementosAgrupados({
  listaElementos,
  gruposIngresadosSegunRubro,
  tipoPagoSeleccionado,
  letraTipoPagoDefault,
}: {
  listaElementos: RubroTotal[];

  gruposIngresadosSegunRubro: GruposPorRubro;

  tipoPagoSeleccionado: TipoPagoPorRubro;

  letraTipoPagoDefault: "P" | "C";
}): ElementoAgrupado[] {
  const salida: ElementoAgrupado[] = [];

  const gruposMap = new Map<string, ElementoAgrupado>();

  for (const item of listaElementos) {
    const rubroId = String(item.value ?? "");

    const metodo = getMetodo(item);

    const codMoneda = metodo?.cod_moneda_venta ?? "SIN_MONEDA";

    const venta = Number(metodo?.venta ?? 0);

    const idDeGrupo = gruposIngresadosSegunRubro[rubroId]?.idDeGrupo;

    /*
     * Sin grupo:
     * permanece como rubro normal.
     */
    if (!idDeGrupo) {
      salida.push({
        ...item,
        __tipo: "ITEM",
      });

      continue;
    }

    const tipoPago = tipoPagoSeleccionado[rubroId] ?? item.letra_tipo_pago ?? letraTipoPagoDefault;

    /*
     * No mezclar:
     *
     * grupo + moneda + P/C
     */
    const key = `${idDeGrupo}__${codMoneda}__${tipoPago}`;

    const existente = gruposMap.get(key);

    if (!existente) {
      gruposMap.set(key, {
        value: `GRUPO_${key}`,

        __tipo: "GRUPO",

        __idDeGrupo: idDeGrupo,

        __codMoneda: codMoneda,

        letra_tipo_pago: tipoPago,

        metodo: {
          ...(metodo ?? {}),

          cod_moneda_venta: codMoneda,

          venta,

          detalles: [...(metodo?.detalles ?? [])],
        },
      });

      continue;
    }

    const metodoGrupo = getMetodo(existente);

    if (!metodoGrupo) {
      continue;
    }

    metodoGrupo.venta = Number(metodoGrupo.venta ?? 0) + venta;

    metodoGrupo.detalles = [...(metodoGrupo.detalles ?? []), ...(metodo?.detalles ?? [])];
  }

  /*
   * Igual al legado:
   * grupos primero,
   * rubros sueltos después.
   */
  return [...Array.from(gruposMap.values()), ...salida];
}
