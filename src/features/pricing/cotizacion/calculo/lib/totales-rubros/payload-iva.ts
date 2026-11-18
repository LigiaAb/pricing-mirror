import { TIPO_PAGO } from "../constantes";
import { construirDetalleMetodo, getMetodo } from "./metodo-tipo-pago";
import type { EntidadTotal, Id, RubroAgrupadoPayload, RubroTotal, TotalesPorMoneda } from "./tipos";

/* ==========================================================================
 * FILAS DE IVA DEL PAYLOAD
 *
 * Solo las usa `construirPayloadRubrosAgrupados` (payload-rubros.ts).
 * ========================================================================== */

/*
 * ======================================
 * IVA QUE YA VIENE DEL BACK
 * ======================================
 */

export function construirPayloadIvaExistente({
  rubrosIvaEnCalculo,
  listaElementos,
  codRubroIVA,
  entidad,
  porcentajeIVA,
}: {
  rubrosIvaEnCalculo: RubroTotal[];

  listaElementos: RubroTotal[];

  codRubroIVA: Id | null | undefined;

  entidad: EntidadTotal | null | undefined;

  porcentajeIVA: number;
}): RubroAgrupadoPayload[] {
  return rubrosIvaEnCalculo.map((item) => {
    const metodo = getMetodo(item);

    const ventaIva = Number(metodo?.venta ?? 0);

    const costoIva = Number(metodo?.costo ?? ventaIva);

    return {
      cod_detallerubro: item.cod_detallerubro ?? null,

      cod_cotizaciondetalle:
        item.cod_cotizaciondetalle ?? listaElementos[0]?.cod_cotizaciondetalle ?? null,

      cod_rubro: item.cod_rubro ?? codRubroIVA ?? null,

      gruporubro_nombre: "IVA",

      costo_rubro: costoIva,

      costo_grupo: costoIva,

      venta_rubro: ventaIva,

      venta_grupo: ventaIva,

      es_tarifa_spot: false,

      cod_moneda_costo: metodo?.cod_moneda_costo ?? metodo?.cod_moneda_venta ?? null,

      cod_moneda_venta: metodo?.cod_moneda_venta ?? null,

      cod_servicio: null,

      entidad_id:
        item.servicio?.entidad_id ??
        item.entidad_id ??
        entidad?.entidad_id ??
        entidad?.cod_entidad ??
        entidad?.id ??
        null,

      clasificacion: null,

      /*
       * Igual que el legado:
       * IVA existente siempre P.
       */
      cod_tipo_pago: 128,

      cod_tipo_facturacion: null,

      cod_tipo_calculo: null,

      cod_metodo: null,

      rate_costo: metodo?.rate_costo ?? item.rate_costo ?? porcentajeIVA,

      rate_venta: metodo?.rate_venta ?? item.rate_venta ?? porcentajeIVA,

      detalle: construirDetalleMetodo(metodo) || String(item.detalle ?? "") || "IVA: 12%",
    };
  });
}

/*
 * ======================================
 * IVA GENERADO LOCALMENTE
 * ======================================
 */

export function construirPayloadIvaLocal({
  totalPorMoneda,
  codCotizacionDetalle,
  codRubroIVA,
  codTipoPago,
  entidad,
  porcentajeIVA,
}: {
  totalPorMoneda: TotalesPorMoneda;

  codCotizacionDetalle: Id | null;

  codRubroIVA: Id;

  codTipoPago: Id | null | undefined;

  entidad: EntidadTotal | null | undefined;

  porcentajeIVA: number;
}): RubroAgrupadoPayload[] {
  const filasIva: RubroAgrupadoPayload[] = [];

  for (const [codMoneda, totalMoneda] of Object.entries(totalPorMoneda)) {
    const iva = Number(totalMoneda?.iva ?? 0);

    filasIva.push({
      cod_detallerubro: null,

      cod_cotizaciondetalle: codCotizacionDetalle,

      cod_rubro: codRubroIVA,

      gruporubro_nombre: "IVA",

      costo_rubro: iva,
      costo_grupo: iva,

      venta_rubro: iva,
      venta_grupo: iva,

      es_tarifa_spot: false,

      cod_moneda_costo: totalMoneda?.moneda?.cod_moneda ?? codMoneda,

      cod_moneda_venta: totalMoneda?.moneda?.cod_moneda ?? codMoneda,

      cod_servicio: null,

      entidad_id: entidad?.entidad_id ?? entidad?.cod_entidad ?? entidad?.id ?? null,

      clasificacion: null,

      cod_tipo_pago:
        Number(codTipoPago) === TIPO_PAGO.TODOS ? TIPO_PAGO.PREPAID : (codTipoPago ?? null),

      cod_tipo_facturacion: null,

      cod_tipo_calculo: null,

      cod_metodo: null,

      rate_costo: porcentajeIVA,

      rate_venta: porcentajeIVA,

      detalle: "IVA: 12%",
    });
  }

  return filasIva;
}
