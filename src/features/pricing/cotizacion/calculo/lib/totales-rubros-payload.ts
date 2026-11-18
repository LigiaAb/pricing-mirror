import { getClasificacionServicio } from "./clasificacion-rubros";
import { TIPO_PAGO } from "./constantes";
import type { Id } from "./tipos";
import {
  construirDetalleMetodo,
  esTipoPagoPrepaid,
  getLetraTipoPago,
  getMetodo,
  letraToCodTipoPago,
} from "./totales-rubros-helpers";
import {
  type EntidadTotal,
  type GruposPorRubro,
  IVA_DEFAULT,
  type NombresGrupo,
  type RubroAgrupadoPayload,
  type RubroTotal,
  type TipoPagoPorRubro,
  type TotalesPorMoneda,
} from "./totales-rubros-tipos";

/* ==========================================================================
 * PAYLOAD FINAL PARA GUARDAR RUBROS
 * ========================================================================== */

export function construirPayloadRubrosAgrupados({
  listaElementos,
  gruposIngresadosSegunRubro,
  tipoPagoSeleccionado,
  nombresGrupo,
  sugerenciaNombreGrupo,
  codTipoPago,
  rubrosIvaEnCalculo,
  codRubroIVA,
  totalPorMoneda,
  entidad,
  porcentajeIVA = IVA_DEFAULT,
}: {
  listaElementos: RubroTotal[];

  gruposIngresadosSegunRubro: GruposPorRubro;

  tipoPagoSeleccionado: TipoPagoPorRubro;

  nombresGrupo: NombresGrupo;

  sugerenciaNombreGrupo: Record<
    string,
    {
      count: number;
      sugerido: string;
    }
  >;

  codTipoPago?: Id | null;

  rubrosIvaEnCalculo: RubroTotal[];

  codRubroIVA?: Id | null;

  totalPorMoneda: TotalesPorMoneda;

  entidad?: EntidadTotal | null;

  porcentajeIVA?: number;
}): RubroAgrupadoPayload[] {
  if (!listaElementos.length) {
    return [];
  }

  const letraTipoPagoDefault = getLetraTipoPago(codTipoPago);

  /*
   * Total de costo/venta por:
   *
   * grupo + moneda + P/C
   */
  const totalesPorGrupo = new Map<
    string,
    {
      venta_grupo: number;
      costo_grupo: number;
    }
  >();

  for (const item of listaElementos) {
    const rubroId = String(item.value ?? "");

    const idDeGrupo = gruposIngresadosSegunRubro[rubroId]?.idDeGrupo;

    if (!idDeGrupo) {
      continue;
    }

    const metodo = getMetodo(item);

    const codMoneda = metodo?.cod_moneda_venta ?? "SIN_MONEDA";

    const letra = tipoPagoSeleccionado[rubroId] ?? item.letra_tipo_pago ?? letraTipoPagoDefault;

    const key = `${idDeGrupo}__${codMoneda}__${letra}`;

    const actual = totalesPorGrupo.get(key) ?? {
      venta_grupo: 0,
      costo_grupo: 0,
    };

    actual.venta_grupo += Number(metodo?.venta ?? 0);

    actual.costo_grupo += Number(metodo?.costo ?? 0);

    totalesPorGrupo.set(key, actual);
  }

  const getNombreGrupo = (
    idDeGrupo: number | null,

    fallback?: string | null,
  ) => {
    if (!idDeGrupo) {
      return null;
    }

    const key = String(idDeGrupo);

    /*
     * Si el usuario tocó el nombre,
     * incluso dejándolo vacío,
     * respetarlo.
     */
    if (Object.hasOwn(nombresGrupo, key)) {
      return nombresGrupo[key] ?? "";
    }

    const info = sugerenciaNombreGrupo[key];

    const sugerido = info?.count === 1 ? (info.sugerido ?? "") : "";

    return sugerido || fallback || "";
  };

  const payload: RubroAgrupadoPayload[] = listaElementos.map((item) => {
    const rubroId = String(item.value ?? "");

    const metodo = getMetodo(item);

    const idDeGrupo = gruposIngresadosSegunRubro[rubroId]?.idDeGrupo ?? null;

    const nombreGrupo = getNombreGrupo(idDeGrupo, item.nombre);

    const codMoneda = metodo?.cod_moneda_venta ?? "SIN_MONEDA";

    const letra = tipoPagoSeleccionado[rubroId] ?? item.letra_tipo_pago ?? letraTipoPagoDefault;

    const codTipoPagoDB =
      Number(codTipoPago) === TIPO_PAGO.TODOS ? letraToCodTipoPago(letra) : codTipoPago;

    const ventaRubro = Number(metodo?.venta ?? 0);

    const costoRubro = Number(metodo?.costo ?? 0);

    let ventaGrupo = ventaRubro;

    let costoGrupo = costoRubro;

    if (idDeGrupo) {
      const key = `${idDeGrupo}__${codMoneda}__${letra}`;

      const totalGrupo = totalesPorGrupo.get(key);

      if (totalGrupo) {
        ventaGrupo = Number(totalGrupo.venta_grupo ?? 0);

        costoGrupo = Number(totalGrupo.costo_grupo ?? 0);
      }
    }

    return {
      cod_detallerubro: item.cod_detallerubro ?? null,

      cod_cotizaciondetalle: item.cod_cotizaciondetalle ?? null,

      cod_rubro: item.cod_rubro ?? null,

      idDeGrupo,

      gruporubro_nombre: idDeGrupo ? nombreGrupo : (item.nombre ?? null),

      costo_rubro: costoRubro,

      costo_grupo: costoGrupo,

      venta_rubro: ventaRubro,

      venta_grupo: ventaGrupo,

      es_tarifa_spot: item.es_tarifa_spot ?? null,

      es_flete: item.es_flete ?? null,

      // Valor original: el del SPOT si lo trae; si no, el propio del rubro.
      original_venta: metodo?.original_venta ?? metodo?.venta ?? null,

      cod_moneda_costo: metodo?.cod_moneda_costo ?? metodo?.cod_moneda_venta ?? null,

      cod_moneda_venta: metodo?.cod_moneda_venta ?? null,

      cod_servicio: item.servicio?.cod_servicio ?? null,

      entidad_id: item.servicio?.entidad_id ?? item.entidad_id ?? null,

      /*
       * AQUÍ sí aplicamos la decisión
       * que acabamos de tomar:
       *
       * una única fuente de verdad
       * para clasificación.
       */
      clasificacion: getClasificacionServicio(item),

      cod_tipo_pago: codTipoPagoDB ?? null,

      cod_tipo_facturacion: item.cod_tipo_facturacion ?? null,

      cod_tipo_calculo: metodo?.cod_tipo_calculo ?? null,

      cod_metodo: metodo?.cod_metodo ?? null,

      rate_costo: metodo?.rate_costo ?? null,

      rate_venta: metodo?.rate_venta ?? null,

      original_rate_costo: metodo?.original_rate_costo ?? metodo?.rate_costo ?? null,

      original_rate_venta: metodo?.original_rate_venta ?? metodo?.rate_venta ?? null,

      detalle: construirDetalleMetodo(metodo),
    };
  });

  const existeRubroConIVA = listaElementos.some((item) =>
    esTipoPagoPrepaid({
      item,
      codTipoPago: codTipoPago ?? null,
      tipoPagoSeleccionado,
      letraTipoPagoDefault,
    }),
  );

  /*
   * ======================================
   * IVA QUE YA VIENE DEL BACK
   * ======================================
   */

  const payloadIvaExistente: RubroAgrupadoPayload[] = existeRubroConIVA
    ? rubrosIvaEnCalculo.map((item) => {
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
      })
    : [];

  /*
   * Si el back ya mandó IVA,
   * NO generamos otro.
   */
  if (payloadIvaExistente.length) {
    return [...payload, ...payloadIvaExistente];
  }

  /*
   * ======================================
   * IVA GENERADO LOCALMENTE
   * ======================================
   */

  const payloadConIva: RubroAgrupadoPayload[] = [...payload];

  const codCotizacionDetalle = listaElementos[0]?.cod_cotizaciondetalle ?? null;

  if (existeRubroConIVA && codRubroIVA != null) {
    for (const [codMoneda, totalMoneda] of Object.entries(totalPorMoneda)) {
      const iva = Number(totalMoneda?.iva ?? 0);

      payloadConIva.push({
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
  }

  /*
   * Igual que el código viejo:
   * este filtro solo ocurre cuando
   * el IVA fue generado localmente.
   */
  return payloadConIva.filter((item) => Number(item.venta_rubro ?? 0) > 0);
}
