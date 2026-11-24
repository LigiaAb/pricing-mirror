import type { MonedaFlete } from "./carrier-flete";
import {
  aplicarCostoPorcentaje,
  claveValorFactura,
  detalleCoberturaFactura,
  esCoberturaMercaderia,
  esMetodoCostoPorcentaje,
  esRubroManual,
  getCodMonedaVenta,
  primeraMonedaDefinida,
} from "./rubros-manuales";
import type { DetalleTarifa, Id } from "./tipos";
import { buscarMoneda, normalizarBoolean, simboloDeMoneda } from "./utils";

export type RubroDueAgent = {
  value: string;

  cod_rubro?: Id | null;
  cod_servicio?: Id | null;
  cod_moneda_venta?: Id | null;

  nombre?: string | null;
  nombre_rubro?: string | null;

  obligatorio?: unknown;
  servicio_obligatorio?: unknown;
  es_obligatorio?: unknown;

  es_flete?: boolean | null;
  es_tarifa_spot?: boolean | null;

  cod_tipo_calculo?: Id | null;

  quitarBoton?: boolean;

  servicio?: {
    cod_servicio?: Id | null;

    nombre?: string | null;
    siglas?: string | null;

    obligatorio?: unknown;
    servicio_obligatorio?: unknown;
    es_obligatorio?: unknown;

    cod_tipo_calculo?: Id | null;

    cod_moneda_venta?: Id | null;

    metodo?: {
      venta?: string | number | null;
      costo?: string | number | null;

      cod_tipo_calculo?: Id | null;

      cod_moneda_venta?: Id | null;
      cod_moneda_costo?: Id | null;

      porcentaje_venta?: string | number | null;

      minimo_venta?: string | number | null;

      detalles?: DetalleTarifa[];

      [key: string]: unknown;
    } | null;

    [key: string]: unknown;
  } | null;

  metodo?: {
    venta?: string | number | null;
    costo?: string | number | null;

    porcentaje_venta?: string | number | null;
    minimo_venta?: string | number | null;

    cod_moneda_venta?: Id | null;
    cod_moneda_costo?: Id | null;

    detalles?: DetalleTarifa[];

    [key: string]: unknown;
  } | null;

  cobertura?: {
    porcentaje_venta?: string | number | null;
    minimo_venta?: string | number | null;

    [key: string]: unknown;
  } | null;

  [key: string]: unknown;
};

export type RubroObligatorioPendiente = {
  cod_rubro: Id | null;
  nombre_rubro: string;
  items: RubroDueAgent[];
};

export function esServicioObligatorio(item: RubroDueAgent) {
  return (
    normalizarBoolean(item.obligatorio) ||
    normalizarBoolean(item.servicio?.obligatorio) ||
    normalizarBoolean(item.servicio_obligatorio) ||
    normalizarBoolean(item.servicio?.servicio_obligatorio) ||
    normalizarBoolean(item.es_obligatorio) ||
    normalizarBoolean(item.servicio?.es_obligatorio)
  );
}

export function obtenerAutoSeleccionObligatorios(items: RubroDueAgent[]) {
  const porRubro = items.reduce<Record<string, RubroDueAgent[]>>((acc, item) => {
    const key = String(item.cod_rubro ?? "");

    if (!acc[key]) {
      acc[key] = [];
    }

    if (!acc[key].some((actual) => actual.cod_servicio === item.cod_servicio)) {
      acc[key].push(item);
    }

    return acc;
  }, {});

  return Object.values(porRubro).reduce<RubroDueAgent[]>((acc, grupo) => {
    const obligatorios = grupo.filter(esServicioObligatorio).filter((item, index, arr) => {
      const key = `${item.cod_rubro ?? ""}-${item.servicio?.cod_servicio ?? item.cod_servicio ?? ""}`;

      return (
        arr.findIndex((actual) => {
          const actualKey = `${actual.cod_rubro ?? ""}-${actual.servicio?.cod_servicio ?? actual.cod_servicio ?? ""}`;

          return actualKey === key;
        }) === index
      );
    });

    /*
     * Regla vigente del legado:
     * auto-seleccionar solo si existe
     * exactamente un obligatorio por rubro.
     */
    if (obligatorios.length === 1) {
      const obligatorio = obligatorios[0];

      if (obligatorio) {
        acc.push(obligatorio);
      }
    }

    return acc;
  }, []);
}

export function obtenerObligatoriosPendientes({
  items,
  seleccionados,
}: {
  items: RubroDueAgent[];
  seleccionados: RubroDueAgent[];
}): RubroObligatorioPendiente[] {
  const porRubro = items.reduce<Record<string, RubroDueAgent[]>>((acc, item) => {
    const key = String(item.cod_rubro ?? "");

    if (!key) {
      return acc;
    }

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});

  return Object.values(porRubro).reduce<RubroObligatorioPendiente[]>((acc, grupo) => {
    const obligatorios = grupo.filter(esServicioObligatorio);

    /*
     * Los rubros con un único obligatorio
     * se resuelven por auto-selección.
     */
    if (obligatorios.length <= 1) {
      return acc;
    }

    const codRubro = grupo[0]?.cod_rubro ?? null;

    const yaSeleccionado = seleccionados.some(
      (seleccionado) => String(seleccionado.cod_rubro ?? "") === String(codRubro ?? ""),
    );

    if (yaSeleccionado) {
      return acc;
    }

    acc.push({
      cod_rubro: codRubro,
      nombre_rubro: String(grupo[0]?.nombre ?? ""),
      items: obligatorios,
    });

    return acc;
  }, []);
}

export function agregarEstadoBloqueado({
  items,
  seleccionados,
}: {
  items: RubroDueAgent[];

  seleccionados: RubroDueAgent[];
}) {
  return items.map((item) => ({
    ...item,

    blocked: seleccionados.some(
      (seleccionado) =>
        String(seleccionado.cod_rubro) === String(item.cod_rubro) &&
        seleccionado.value !== item.value,
    ),
  }));
}

/*
 * Rubros manuales (ABIERTO, COBERTURA, COSTO_PORCENTAJE): definición única en
 * lib/rubros-manuales.ts. Se reexportan aquí para no romper el barrel.
 */
export {
  calcularCoberturaMercaderia,
  esCoberturaMercaderia,
  esRubroManual as esTipoCalculoManual,
} from "./rubros-manuales";

export type ValoresManualDueAgent = Record<string, string | number>;

export function obtenerCodMonedaEfectiva({
  item,
  codMonedaPadre,
  codMonedaDefault,
}: {
  item: RubroDueAgent;

  codMonedaPadre?: Id | null;

  codMonedaDefault?: Id | null;
}) {
  return getCodMonedaVenta(item) ?? codMonedaPadre ?? codMonedaDefault ?? null;
}

export function aplicarValoresManualDueAgent({
  seleccionados,
  valores,
  codMonedaPadre,
  monedas,
}: {
  seleccionados: RubroDueAgent[];

  valores: ValoresManualDueAgent;

  codMonedaPadre?: Id | null;

  monedas: MonedaFlete[];
}) {
  const codMonedaDefault = primeraMonedaDefinida(seleccionados);

  return seleccionados.map((item) => {
    if (!esRubroManual(item)) {
      return item;
    }

    const codMoneda = obtenerCodMonedaEfectiva({
      item,
      codMonedaPadre: codMonedaPadre ?? null,
      codMonedaDefault,
    });

    if (esMetodoCostoPorcentaje(item)) {
      return aplicarCostoPorcentaje(item, valores[item.value], codMoneda);
    }

    const venta = Number(valores[item.value] ?? 0) || 0;

    const servicio = {
      ...(item.servicio ?? {}),

      metodo: {
        ...(item.servicio?.metodo ?? {}),

        venta,
        costo: venta,

        cod_moneda_venta: codMoneda,

        cod_moneda_costo: codMoneda,

        cod_estado: 1,
      },
    };

    /*
     * Cobertura agrega descripción
     * sobre valor de factura.
     */
    if (esCoberturaMercaderia(item)) {
      const valorFactura = valores[claveValorFactura(item.value)] ?? 0;

      const moneda = buscarMoneda(monedas, codMoneda);

      servicio.metodo.detalles = [
        ...(item.servicio?.metodo?.detalles ?? []),

        detalleCoberturaFactura(simboloDeMoneda(moneda), valorFactura),
      ];
    }

    return {
      ...item,
      servicio,
    };
  });
}

export function calcularTotalDueAgent(rubros: RubroDueAgent[]) {
  return rubros.reduce(
    (total, item) =>
      total + Number(item.servicio?.metodo?.venta ?? item.metodo?.venta ?? item.venta ?? 0),
    0,
  );
}
