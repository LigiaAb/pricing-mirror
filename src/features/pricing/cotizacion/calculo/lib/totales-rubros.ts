import { construirAgrupacionAutomatica } from "./agrupacion-rubros";
import { getClasificacionServicio } from "./clasificacion-rubros";

export const IVA_DEFAULT = 0.12;

import { TIPO_PAGO } from "./constantes";
import type { Id, MonedaCatalogo } from "./tipos";

export type { Id };

export type MetodoTotal = {
  cod_metodo?: Id | null;

  costo?: string | number | null;
  venta?: string | number | null;

  cod_moneda_costo?: Id | null;
  cod_moneda_venta?: Id | null;

  cod_tipo_calculo?: Id | null;

  rate_costo?: string | number | null;
  rate_venta?: string | number | null;

  original_venta?: string | number | null;

  original_rate_costo?: string | number | null;
  original_rate_venta?: string | number | null;

  detalles?: Array<{
    tipo_desc?: string | null;

    tarifadetalle_descripcion?: string | number | null;

    tarifadetalle_valor?: string | number | null;

    [key: string]: unknown;
  }>;

  [key: string]: unknown;
};

export type ServicioTotal = {
  cod_servicio?: Id | null;

  nombre?: string | null;

  entidad_id?: Id | null;
  entidad_nombre?: string | null;

  clasificacion?: Id | null;
  servicio_clasificacion?: Id | null;

  metodo?: MetodoTotal | null;

  [key: string]: unknown;
};

export type RubroTotal = {
  value?: Id | null;

  cod_detallerubro?: Id | null;
  cod_cotizaciondetalle?: Id | null;

  cod_rubro?: Id | null;

  nombre?: string | null;
  gruporubro_nombre?: string | null;

  es_tarifa_spot?: boolean | null;
  es_flete?: boolean | null;

  entidad_id?: Id | null;

  clasificacion?: Id | null;
  servicio_clasificacion?: Id | null;

  cod_tipo_pago?: Id | null | undefined;

  cod_tipo_facturacion?: Id | null;

  /*
   * Algunas filas recuperadas (por ejemplo IVA)
   * pueden traer rates/detalle a nivel raíz.
   */
  rate_costo?: string | number | null;
  rate_venta?: string | number | null;
  detalle?: string | number | null;

  metodo?: MetodoTotal | null;
  servicio?: ServicioTotal | null;

  letra_tipo_pago?: "P" | "C";

  [key: string]: unknown;
};

export type MonedaTotal = MonedaCatalogo;

export type GrupoAsignado = {
  idDeGrupo: number;
  nombre: string;
};

export type GruposPorRubro = Record<string, GrupoAsignado>;

export type NombresGrupo = Record<string, string>;

export type TipoPagoPorRubro = Record<string, "P" | "C">;

export type TotalMoneda = {
  total: number;
  iva: number;
  totalConIVA: number;
  moneda: MonedaTotal;
};

export type TotalesPorMoneda = Record<string, TotalMoneda>;

export type EntidadTotal = {
  entidad_id?: Id | null;
  cod_entidad?: Id | null;
  id?: Id | null;

  [key: string]: unknown;
};

export type RubroAgrupadoPayload = {
  cod_detallerubro?: Id | null;
  cod_cotizaciondetalle?: Id | null;
  cod_rubro?: Id | null;

  /*
   * Se usa para ordenar grupos al guardar en la versión actual.
   * Las filas IVA pueden no pertenecer a un grupo visual.
   */
  idDeGrupo?: number | null;

  gruporubro_nombre?: string | null;

  costo_rubro: number;
  costo_grupo: number;

  venta_rubro: number;
  venta_grupo: number;

  es_tarifa_spot?: boolean | null;
  es_flete?: boolean | null;

  original_venta?: string | number | null;

  cod_moneda_costo?: Id | null;
  cod_moneda_venta?: Id | null;

  cod_servicio?: Id | null;
  entidad_id?: Id | null;
  clasificacion?: Id | null;

  cod_tipo_pago?: Id | null;
  cod_tipo_facturacion?: Id | null;
  cod_tipo_calculo?: Id | null;
  cod_metodo?: Id | null;

  rate_costo?: string | number | null;
  rate_venta?: string | number | null;

  original_rate_costo?: string | number | null;
  original_rate_venta?: string | number | null;

  detalle: string;
};

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
 * IVA / FLETE SPOT
 * ========================================================================== */

function esRubroIva(item: RubroTotal, codRubroIVA?: Id | null) {
  const nombre = String(item.nombre ?? item.gruporubro_nombre ?? "")
    .trim()
    .toUpperCase();

  return (
    (codRubroIVA != null && String(item.cod_rubro) === String(codRubroIVA)) || nombre === "IVA"
  );
}

export function separarRubrosParaTotales({
  rubros,
  codRubroIVA,
}: {
  rubros: RubroTotal[];
  codRubroIVA?: Id | null;
}) {
  const tieneTarifaSpot = rubros.some((item) => item.es_tarifa_spot === true);

  /*
   * Comportamiento actual:
   *
   * - los no-flete siempre permanecen.
   * - si existe SPOT:
   *      de los fletes únicamente queda el SPOT.
   * - si no existe SPOT:
   *      permanecen los fletes normales.
   */
  const rubrosAplicables = rubros.filter(
    (item) => !item.es_flete || (tieneTarifaSpot ? item.es_tarifa_spot : item.es_flete),
  );

  return {
    tieneTarifaSpot,

    rubrosIvaEnCalculo: rubrosAplicables.filter((item) => esRubroIva(item, codRubroIVA)),

    rubrosSinIva: rubrosAplicables.filter((item) => !esRubroIva(item, codRubroIVA)),
  };
}
/* ==========================================================================
 * AGRUPACIÓN GUARDADA
 * ========================================================================== */

export function construirAgrupacionDesdeDetalle(rubros: RubroTotal[]) {
  const gruposIngresados: GruposPorRubro = {};

  const nombres: NombresGrupo = {};

  const idPorNombre = new Map<string, number>();

  let siguienteId = 1;

  for (const item of rubros) {
    const nombre = String(item.gruporubro_nombre ?? "").trim();

    if (!nombre) {
      continue;
    }

    if (item.value == null || item.value === "") {
      continue;
    }

    if (!idPorNombre.has(nombre)) {
      idPorNombre.set(nombre, siguienteId);

      nombres[String(siguienteId)] = nombre;

      siguienteId += 1;
    }

    const idDeGrupo = idPorNombre.get(nombre);

    if (idDeGrupo == null) {
      continue;
    }

    gruposIngresados[String(item.value)] = {
      idDeGrupo,
      nombre,
    };
  }

  return {
    gruposIngresados,
    nombres,
  };
}

/* ==========================================================================
 * LISTA NORMALIZADA
 * ========================================================================== */

export function construirListaElementos({
  rubros,
  codTipoPago,
}: {
  rubros: RubroTotal[];
  codTipoPago?: Id | null;
}) {
  const letraTipoPagoDefault = getLetraTipoPago(codTipoPago);

  return (
    rubros
      .map((item) => ({
        ...item,

        cod_tipo_pago: codTipoPago ?? null,

        letra_tipo_pago: letraTipoPagoDefault,

        idDeGrupo: 0,
      }))

      /*
       * Los rubros pueden traer el método en dos formas válidas:
       *
       * - item.metodo
       * - item.servicio.metodo
       *
       * Due Agent (incluyendo ABIERTOS y COBERTURA) actualiza la segunda.
       * Usar únicamente item.metodo hacía que esos rubros desaparecieran
       * de la lista de Totales aunque tuvieran venta calculada.
       */
      .filter((item) => {
        const venta = getMetodo(item)?.venta;

        return venta != null && Number(venta) !== 0;
      })
  );
}
/* ==========================================================================
 * ESTADO INICIAL DE AGRUPACIÓN
 * ========================================================================== */

export function construirEstadoInicialTotales({
  rubrosSinIva,
  codTipoPago,
  codCc,
  codTipoTransporte,
}: {
  rubrosSinIva: RubroTotal[];

  codTipoPago?: Id | null;

  codCc?: Id | null;

  codTipoTransporte?: Id | null;
}) {
  const letraTipoPagoDefault = getLetraTipoPago(codTipoPago);

  const agrupacionAutomatica = construirAgrupacionAutomatica(rubrosSinIva, {
    codCc: codCc ?? null,
    codTipoTransporte: codTipoTransporte ?? null,
  });

  const agrupacionGuardada = construirAgrupacionDesdeDetalle(rubrosSinIva);

  /*
   * Igual al legado:
   *
   * lo guardado en detalle gana
   * sobre la agrupación automática.
   */
  const gruposIngresadosSegunRubro: GruposPorRubro = {
    ...agrupacionAutomatica.gruposIngresados,
    ...agrupacionGuardada.gruposIngresados,
  };

  const nombresGrupo: NombresGrupo = {
    ...agrupacionAutomatica.nombres,
    ...agrupacionGuardada.nombres,
  };

  const tipoPagoSeleccionado: TipoPagoPorRubro = {};

  for (const item of rubrosSinIva) {
    if (item?.value == null || item.value === "") {
      continue;
    }

    const key = String(item.value);

    if (Number(codTipoPago) === TIPO_PAGO.TODOS) {
      tipoPagoSeleccionado[key] = item.cod_tipo_pago
        ? getLetraTipoPago(item.cod_tipo_pago)
        : letraTipoPagoDefault;
    } else {
      tipoPagoSeleccionado[key] = letraTipoPagoDefault;
    }
  }

  return {
    letraTipoPagoDefault,

    gruposIngresadosSegunRubro,

    nombresGrupo,

    tipoPagoSeleccionado,
  };
}
/* ==========================================================================
 * SUGERENCIA DE NOMBRE DE GRUPO
 * ========================================================================== */

export function construirSugerenciasNombreGrupo({
  listaElementos,
  gruposIngresadosSegunRubro,
}: {
  listaElementos: RubroTotal[];

  gruposIngresadosSegunRubro: GruposPorRubro;
}) {
  const resultado: Record<
    string,
    {
      count: number;
      sugerido: string;
    }
  > = {};

  for (const item of listaElementos) {
    const rubroId = String(item.value ?? "");

    const idDeGrupo = gruposIngresadosSegunRubro[rubroId]?.idDeGrupo;

    if (!idDeGrupo) {
      continue;
    }

    const key = String(idDeGrupo);

    const nombreServicio = item.servicio?.nombre ?? "";

    if (!resultado[key]) {
      resultado[key] = {
        count: 1,

        sugerido: nombreServicio,
      };

      continue;
    }

    resultado[key].count += 1;

    /*
     * Si hay más de un servicio,
     * deja de sugerir nombre.
     */
    resultado[key].sugerido = "";
  }

  return resultado;
}
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

export type ElementoAgrupado = RubroTotal & {
  __tipo?: "ITEM" | "GRUPO";

  __idDeGrupo?: number;

  __codMoneda?: Id | "SIN_MONEDA";
};

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

      original_venta: metodo?.original_venta ?? null,

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

      original_rate_costo: metodo?.original_rate_costo ?? null,

      original_rate_venta: metodo?.original_rate_venta ?? null,

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
