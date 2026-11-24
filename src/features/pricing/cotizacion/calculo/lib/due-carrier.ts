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
import { buscarMoneda, numero, simboloDeMoneda } from "./utils";

export type RubroDueCarrier = {
  value?: string | null;

  cod_rubro?: Id | null;
  cod_servicio?: Id | null;

  nombre?: string | null;
  nombre_rubro?: string | null;

  siglas?: string | null;

  entidad_id?: Id | null;

  es_flete?: boolean | null;
  es_tarifa_spot?: boolean | null;

  venta?: string | number | null;
  costo?: string | number | null;

  cod_moneda_venta?: Id | null;

  cod_tipo_calculo?: Id | null;

  metodo?: {
    venta?: string | number | null;
    costo?: string | number | null;

    cod_moneda_venta?: Id | null;
    cod_moneda_costo?: Id | null;

    cod_tipo_calculo?: Id | null;

    detalles?: DetalleTarifa[];

    [key: string]: unknown;
  } | null;

  servicio?: {
    cod_servicio?: Id | null;

    nombre?: string | null;

    entidad_id?: Id | null;

    cod_moneda_venta?: Id | null;

    cod_tipo_calculo?: Id | null;

    metodo?: {
      venta?: string | number | null;
      costo?: string | number | null;

      cod_moneda_venta?: Id | null;
      cod_moneda_costo?: Id | null;

      cod_tipo_calculo?: Id | null;

      detalles?: DetalleTarifa[];

      [key: string]: unknown;
    } | null;

    [key: string]: unknown;
  } | null;

  [key: string]: unknown;
};

export type ValoresManualDueCarrier = Record<string, string | number>;
export function getCodServicioDueCarrier(item: RubroDueCarrier) {
  return item.cod_servicio ?? item.servicio?.cod_servicio ?? null;
}

export function getEntidadIdDueCarrier(item: RubroDueCarrier) {
  return item.entidad_id ?? item.servicio?.entidad_id ?? null;
}

export function getCodMonedaDueCarrier(item: RubroDueCarrier) {
  return getCodMonedaVenta(item);
}

export function getMetodoDueCarrier(item: RubroDueCarrier) {
  return item.servicio?.metodo ?? item.metodo ?? null;
}

/** ABIERTO, COBERTURA o COSTO_PORCENTAJE (definición única en lib/rubros-manuales.ts). */
export function esDueCarrierManual(item: RubroDueCarrier) {
  return esRubroManual(item);
}
export function crearKeyRubroDueCarrier(item: RubroDueCarrier) {
  const codRubro = item.cod_rubro ?? "";

  const codServicio = getCodServicioDueCarrier(item) ?? "";

  const entidadId = getEntidadIdDueCarrier(item) ?? "";

  const tipo = item.es_tarifa_spot ? "SPOT" : "NORMAL";

  return `${codRubro}|${codServicio}|${entidadId}|${tipo}`;
}

export function deduplicarRubrosDueCarrier(rubros: RubroDueCarrier[]) {
  const vistos = new Set<string>();

  return rubros.filter((item) => {
    const key = crearKeyRubroDueCarrier(item);

    if (vistos.has(key)) {
      return false;
    }

    vistos.add(key);

    return true;
  });
}
export function filtrarFleteActivoDueCarrier(rubros: RubroDueCarrier[]) {
  const tieneSpot = rubros.some((item) => item.es_tarifa_spot === true);

  return rubros.filter((item) => {
    /*
     * Todo rubro que no sea flete
     * siempre permanece.
     */
    if (item.es_flete !== true) {
      return true;
    }

    /*
     * Si existe SPOT:
     * únicamente queda el flete SPOT.
     */
    if (tieneSpot) {
      return item.es_tarifa_spot === true;
    }

    /*
     * Sin SPOT:
     * queda el flete normal.
     */
    return true;
  });
}
export function obtenerCodMonedaDefaultDueCarrier(rubros: RubroDueCarrier[]) {
  return primeraMonedaDefinida(rubros);
}

export function obtenerCodMonedaEfectivaDueCarrier({
  item,
  codMonedaDefault,
}: {
  item: RubroDueCarrier;

  codMonedaDefault?: Id | null;
}) {
  return getCodMonedaDueCarrier(item) ?? codMonedaDefault ?? null;
}
export function aplicarValoresManualDueCarrier({
  rubros,
  valores,
  lectura,
  monedas,
}: {
  rubros: RubroDueCarrier[];

  valores: ValoresManualDueCarrier;

  lectura: boolean;

  monedas: MonedaFlete[];
}) {
  const codMonedaDefault = obtenerCodMonedaDefaultDueCarrier(rubros);

  return rubros.map((item): RubroDueCarrier => {
    if (!esRubroManual(item)) {
      return item;
    }

    /*
     * En lectura no se toca
     * absolutamente nada.
     */
    if (lectura) {
      return item;
    }

    const codMoneda = obtenerCodMonedaEfectivaDueCarrier({
      item,
      codMonedaDefault,
    });

    if (esMetodoCostoPorcentaje(item)) {
      return aplicarCostoPorcentaje(item, valores[String(item.value)], codMoneda);
    }

    const valor = Number(valores[String(item.value)]) || 0;

    const resultado = {
      ...item,

      venta: valor,
      costo: valor,

      metodo: {
        ...(item.metodo ?? {}),

        cod_metodo: item.metodo?.cod_metodo ?? null,

        venta: valor,
        costo: valor,

        cod_moneda_venta: item.metodo?.cod_moneda_venta ?? codMoneda,

        cod_moneda_costo: item.metodo?.cod_moneda_costo ?? codMoneda,
      },

      servicio: {
        ...(item.servicio ?? {}),

        metodo: {
          ...(item.servicio?.metodo ?? {}),

          cod_metodo: item.metodo?.cod_metodo ?? null,

          venta: valor,
          costo: valor,

          cod_moneda_venta: codMoneda,

          cod_moneda_costo: codMoneda,
        },
      },
    };

    /*
     * Cobertura: `valor` ya es la cobertura calculada; además se agrega
     * el detalle sobre el valor de factura (igual que en Due Agent).
     */
    if (esCoberturaMercaderia(item)) {
      const detalle = detalleCoberturaFactura(
        simboloDeMoneda(buscarMoneda(monedas, codMoneda)),
        valores[claveValorFactura(item.value)] ?? 0,
      );

      resultado.metodo.detalles = [...(item.metodo?.detalles ?? []), detalle];

      resultado.servicio.metodo.detalles = [...(item.servicio?.metodo?.detalles ?? []), detalle];
    }

    return resultado;
  });
}
export type TotalDueCarrierMoneda = {
  moneda: MonedaFlete;
  total: number;
};

export function calcularTotalesDueCarrier({
  rubros,
  monedas,
}: {
  rubros: RubroDueCarrier[];

  monedas: MonedaFlete[];
}) {
  return rubros.reduce<Record<string, TotalDueCarrierMoneda>>((resultado, item) => {
    const codMoneda = getCodMonedaDueCarrier(item);

    if (codMoneda == null) {
      return resultado;
    }

    const moneda = buscarMoneda(monedas, codMoneda);

    if (!moneda) {
      return resultado;
    }

    const key = String(moneda.cod_moneda);

    const venta = numero(item.servicio?.metodo?.venta ?? item.metodo?.venta ?? item.venta);

    resultado[key] = {
      moneda,

      total: (resultado[key]?.total ?? 0) + venta,
    };

    return resultado;
  }, {});
}
export function procesarRubrosDueCarrier({
  rubros,
  valores,
  lectura,
  monedas,
}: {
  rubros: RubroDueCarrier[];

  valores: ValoresManualDueCarrier;

  lectura: boolean;

  monedas: MonedaFlete[];
}) {
  /*
   * 1. eliminar duplicados
   */
  const sinDuplicados = deduplicarRubrosDueCarrier(rubros);

  /*
   * 2. decidir flete normal vs SPOT
   */
  const conFleteActivo = filtrarFleteActivoDueCarrier(sinDuplicados);

  /*
   * 3. aplicar manuales (abiertos, cobertura, costo por porcentaje)
   */
  return aplicarValoresManualDueCarrier({
    rubros: conFleteActivo,

    valores,

    lectura,

    monedas,
  });
}
