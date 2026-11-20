import { type Moneda, monedas } from "@/features/catalogos";

/* ==========================================================================
 * MONEDAS OPERATIVAS
 *
 * Única consulta de monedas de Tarifas: catálogo `monedas` de
 * @/features/catalogos filtrado por `es_operativa`. Los nombres viejos
 * (useMonedasPorcentaje, useMonedasEquipo, ...) se conservan como alias en
 * cada archivo tarifa-*.ts.
 * ========================================================================== */

export type MonedaOperativa = Moneda;

const FILTROS_OPERATIVAS = { es_operativa: true };

export const MONEDAS_OPERATIVAS_QUERY_KEY = monedas.keys.all;

export const monedasOperativasOptions = () => monedas.listaOptions(FILTROS_OPERATIVAS);

export function useMonedasOperativas() {
  return monedas.useLista(FILTROS_OPERATIVAS);
}
