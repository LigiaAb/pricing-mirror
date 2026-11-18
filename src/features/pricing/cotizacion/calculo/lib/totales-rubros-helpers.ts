import { TIPO_PAGO } from "./constantes";
import type { Id } from "./tipos";
import type { MetodoTotal, RubroTotal, TipoPagoPorRubro } from "./totales-rubros-tipos";

/* ==========================================================================
 * MÉTODO
 * ========================================================================== */

export function getMetodo(item?: RubroTotal | null): MetodoTotal | undefined {
  /*
   * Para filas con `servicio`, el método efectivo vive en
   * `servicio.metodo`.
   *
   * Esto es especialmente importante para Due Agent:
   * ABIERTOS y COBERTURA actualizan `servicio.metodo.venta`, mientras que
   * `item.metodo` puede conservar el valor anterior proveniente del cálculo.
   *
   * Los elementos sintéticos de grupo y algunas filas guardadas no tienen
   * `servicio`, por eso `item.metodo` se mantiene como fallback.
   */
  return item?.servicio?.metodo ?? item?.metodo ?? undefined;
}

/* ==========================================================================
 * TIPO DE PAGO
 * ========================================================================== */

export function getLetraTipoPago(codTipoPago?: Id | null): "P" | "C" {
  if (Number(codTipoPago) === TIPO_PAGO.COLLECT) {
    return "C";
  }

  return "P";
}

export function letraToCodTipoPago(letra?: string | null) {
  return letra === "C" ? TIPO_PAGO.COLLECT : TIPO_PAGO.PREPAID;
}

export function esTipoPagoPrepaid({
  item,
  codTipoPago,
  tipoPagoSeleccionado,
  letraTipoPagoDefault,
}: {
  item: RubroTotal;

  codTipoPago?: Id | null;

  tipoPagoSeleccionado: TipoPagoPorRubro;

  letraTipoPagoDefault: "P" | "C";
}) {
  if (Number(codTipoPago) === TIPO_PAGO.TODOS) {
    const rubroId = String(item.value ?? "");

    return (tipoPagoSeleccionado[rubroId] ?? item.letra_tipo_pago ?? letraTipoPagoDefault) === "P";
  }

  return Number(item.cod_tipo_pago ?? codTipoPago) === TIPO_PAGO.PREPAID;
}

/* ==========================================================================
 * DETALLE
 * ========================================================================== */

export function construirDetalleMetodo(metodo?: MetodoTotal | null) {
  return (metodo?.detalles ?? [])
    .map((item) => {
      const tipo = String(item?.tipo_desc ?? "").trim();

      const descripcion = String(
        item?.tarifadetalle_descripcion ?? item?.tarifadetalle_valor ?? "",
      ).trim();

      if (!tipo && !descripcion) {
        return "";
      }

      if (!tipo) {
        return descripcion;
      }

      if (!descripcion) {
        return tipo;
      }

      return `${tipo}: ${descripcion}`;
    })
    .filter(Boolean)
    .join(", ");
}
