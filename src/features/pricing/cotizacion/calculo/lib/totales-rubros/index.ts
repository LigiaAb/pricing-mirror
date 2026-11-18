/* ==========================================================================
 * TOTALES DE RUBROS
 *
 * Punto de entrada de `lib/totales-rubros/`: reexporta por nombre lo que usan
 * `hooks/use-totales-rubros.ts` y `components/totales-rubros.tsx`.
 * `payload-iva.ts` no se reexporta (solo lo usa `payload-rubros.ts`).
 * ========================================================================== */

export {
  construirAgrupacionDesdeDetalle,
  construirElementosAgrupados,
  construirEstadoInicialTotales,
  construirListaElementos,
  construirSugerenciasNombreGrupo,
} from "./agrupacion";
export {
  construirDetalleMetodo,
  esTipoPagoPrepaid,
  getLetraTipoPago,
  getMetodo,
  IVA_DEFAULT,
  letraToCodTipoPago,
} from "./metodo-tipo-pago";
export { construirPayloadRubrosAgrupados } from "./payload-rubros";
export { separarRubrosParaTotales } from "./separar-rubros";
export type {
  ElementoAgrupado,
  EntidadTotal,
  GrupoAsignado,
  GruposPorRubro,
  Id,
  MetodoTotal,
  MonedaTotal,
  NombresGrupo,
  RubroAgrupadoPayload,
  RubroTotal,
  ServicioTotal,
  TipoPagoPorRubro,
  TotalesPorMoneda,
  TotalMoneda,
} from "./tipos";
export { calcularTotalesPorMoneda } from "./totales-moneda";
