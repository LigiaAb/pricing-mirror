/* ==========================================================================
 * RUBROS CON VALOR MANUAL (Due Agent y Due Carrier)
 *
 * Lectura del método de un rubro y cálculo de los rubros que el usuario
 * completa a mano: tipo de cálculo ABIERTO, COBERTURA DE MERCADERÍA o método
 * COSTO_PORCENTAJE. Cualquiera de ellos puede llegar en Due Agent o en Due
 * Carrier; cada tabla solo decide cómo escribe el valor en su rubro.
 * Antes esta lógica estaba copiada en lib/due-agent.ts y lib/due-carrier.ts.
 * ========================================================================== */

import { TIPO_CALCULO, TIPO_METODO } from "./constantes";
import type { Id, Registro } from "./tipos";
import { registro } from "./utils";

/** Forma mínima de un rubro que trae su método directo o dentro de `servicio`. */
export type RubroConMetodo = {
  cod_tipo_calculo?: Id | null;
  cod_moneda_venta?: Id | null;
  metodo?: Registro | null;
  servicio?: (Registro & { metodo?: Registro | null }) | null;
  [key: string]: unknown;
};

/** cod_moneda_venta del rubro: método del servicio → servicio → rubro. */
export function getCodMonedaVenta(item: RubroConMetodo): Id | null {
  return (
    (item.servicio?.metodo?.cod_moneda_venta as Id | null | undefined) ??
    (item.servicio?.cod_moneda_venta as Id | null | undefined) ??
    item.cod_moneda_venta ??
    null
  );
}

/** cod_tipo_calculo del rubro: método del servicio → servicio → rubro. */
export function getCodTipoCalculo(item: RubroConMetodo): unknown {
  return (
    item.servicio?.metodo?.cod_tipo_calculo ??
    item.servicio?.cod_tipo_calculo ??
    item.cod_tipo_calculo
  );
}

/** Primera moneda definida dentro de una lista de rubros. */
export function primeraMonedaDefinida(rubros: RubroConMetodo[]): Id | null {
  return (
    rubros
      .map(getCodMonedaVenta)
      .find((codMoneda) => codMoneda != null && String(codMoneda).trim() !== "") ?? null
  );
}

/* ==========================================================================
 * MÉTODO COSTO_PORCENTAJE
 * ========================================================================== */

export function esMetodoCostoPorcentaje(item: Registro): boolean {
  const servicio = registro(item.servicio);
  const metodoServicio = registro(servicio.metodo);
  const codTipo =
    metodoServicio.cod_tipo_metodo ?? servicio.cod_tipo_metodo ?? item.cod_tipo_metodo;
  return Number(codTipo) === TIPO_METODO.COSTO_PORCENTAJE;
}

export function calcularVentaCostoPorcentaje(item: Registro, valorCosto: string | number) {
  const servicio = registro(item.servicio);
  const metodo = registro(servicio.metodo ?? item.metodo);
  const costo = Number(valorCosto);
  const minimo = Number(metodo.minimo_venta ?? 0);
  const tipo = metodo.es_porcentaje;
  const esPorcentaje =
    tipo === true ||
    tipo === 1 ||
    (typeof tipo === "string" && ["1", "true"].includes(tipo.trim().toLowerCase()));
  // Tarifas guarda el porcentaje en enteros (25.26 = 25.26 %) → factor 0.2526.
  // Si es valor fijo se usa tal cual.
  const valorTarifa = Number(metodo.porcentaje_venta ?? 0);
  const factor = esPorcentaje ? valorTarifa / 100 : valorTarifa;

  if (!Number.isFinite(costo) || !Number.isFinite(factor) || !Number.isFinite(minimo)) {
    return { costo: 0, venta: 0 };
  }

  const valorCalculado = esPorcentaje ? costo + costo * factor : costo + factor;
  return { costo, venta: Math.max(valorCalculado, minimo) };
}

/**
 * Aplica el costo capturado a un rubro COSTO_PORCENTAJE: calcula la venta y
 * la escribe en el rubro, en `metodo` y en `servicio.metodo`.
 * Vacío → costo y venta en 0.
 */
export function aplicarCostoPorcentaje<T extends RubroConMetodo>(
  item: T,
  valorCosto: string | number | null | undefined,
): T {
  const { costo, venta } =
    valorCosto == null || valorCosto === ""
      ? { costo: 0, venta: 0 }
      : calcularVentaCostoPorcentaje(item, valorCosto);
  const metodo = { ...(item.servicio?.metodo ?? item.metodo ?? {}), costo, venta };

  return {
    ...item,
    costo,
    venta,
    metodo,
    servicio: { ...(item.servicio ?? {}), metodo },
  };
}

/* ==========================================================================
 * QUÉ RUBROS SON MANUALES
 * ========================================================================== */

/** Tipo de cálculo ABIERTO: el usuario escribe la venta. */
export function esTipoCalculoAbierto(item: RubroConMetodo): boolean {
  return Number(getCodTipoCalculo(item)) === TIPO_CALCULO.ABIERTO;
}

/** Tipo de cálculo COBERTURA DE MERCADERÍA: el usuario escribe el valor de factura. */
export function esCoberturaMercaderia(item: RubroConMetodo): boolean {
  return Number(getCodTipoCalculo(item)) === TIPO_CALCULO.COBERTURA_MERCADERIA;
}

/** Rubro que se completa a mano (en Due Agent o en Due Carrier). */
export function esRubroManual(item: RubroConMetodo): boolean {
  return esMetodoCostoPorcentaje(item) || esTipoCalculoAbierto(item) || esCoberturaMercaderia(item);
}

/* ==========================================================================
 * COBERTURA DE MERCADERÍA
 * ========================================================================== */

/** Llave, dentro de los valores manuales, del valor de factura que escribió el usuario. */
export function claveValorFactura(value: unknown): string {
  return `${String(value ?? "")}_a_calcular`;
}

/**
 * Cobertura = MAX(mínimo venta, techo((flete + factura) × 1.1 × porcentaje venta / 100)).
 * Sin factura (≤ 0) la cobertura es 0. `valorFlete` es el `valor_flete` de los
 * criterios, que es el flete del carrier seleccionado.
 */
export function calcularCoberturaMercaderia({
  item,
  valorFactura,
  valorFlete,
}: {
  item: RubroConMetodo;

  valorFactura: string | number | null;

  valorFlete: string | number | null;
}) {
  const factura = Number(valorFactura ?? 0);

  const flete = Number(valorFlete ?? 0);

  const metodoCalculo = registro(item.metodo ?? item.cobertura);

  const porcentaje = Number(metodoCalculo.porcentaje_venta ?? 0) / 100;

  const minimo = Number(metodoCalculo.minimo_venta ?? 0);

  const calculado = (flete + factura) * 1.1 * porcentaje;

  const redondeado = Math.ceil(calculado);

  if (factura <= 0) {
    return 0;
  }

  return Math.max(minimo, redondeado);
}

/** Detalle "Sobre valor de factura" que acompaña a la cobertura. */
export function detalleCoberturaFactura(simbolo: string, valorFactura: string | number) {
  return {
    tipo_desc: "",

    tarifadetalle_descripcion: `Sobre valor de factura ${simbolo} ${valorFactura}`,

    tarifadetalle_valor: valorFactura,
  };
}
