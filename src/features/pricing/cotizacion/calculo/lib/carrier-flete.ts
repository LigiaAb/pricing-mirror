import type { CatalogoTipo, Id, MonedaCatalogo } from "./tipos";
import { buscarMoneda } from "./utils";
import { construirDetalleFlete } from "./detalle-flete";

export type MetodoFlete = {
  cod_metodo?: Id | null;

  venta?: string | number | null;
  costo?: string | number | null;

  cod_moneda_venta?: Id | null;
  cod_moneda_costo?: Id | null;

  categoria_transporte?: Id | null;
  cod_categoria_transporte?: Id | null;

  rate_costo?: string | number | null;
  rate_venta?: string | number | null;

  original_rate_costo?: string | number | null;
  original_rate_venta?: string | number | null;

  original_venta?: string | number | null;
  original_costo?: string | number | null;

  detalles?: Array<Record<string, unknown>>;

  [key: string]: unknown;
};

export type ServicioFlete = {
  cod_servicio?: Id | null;

  nombre?: string | null;
  nombre_servicio?: string | null;

  entidad_id?: Id | null;
  entidad_nombre?: string | null;

  categoria_transporte?: Id | null;
  cod_categoria_transporte?: Id | null;

  categoria_transporte_desc?: string | null;
  categoria_transporte_nombre?: string | null;

  cod_tipo_carga?: Id | null;
  cod_clasificacion_carga?: Id | null;

  es_flete?: boolean | null;

  metodo?: MetodoFlete | null;

  [key: string]: unknown;
};

export type RubroFlete = {
  value?: string | null;

  cod_rubro?: Id | null;

  nombre?: string | null;
  nombre_rubro?: string | null;

  cod_detallerubro?: Id | null;

  es_flete?: boolean | null;
  es_tarifa_spot?: boolean | null;

  cod_tipo_pago?: Id | null;

  entidad_id?: Id | null;
  entidad_nombre?: string | null;

  cod_servicio?: Id | null;

  venta?: string | number | null;
  costo?: string | number | null;

  metodo?: MetodoFlete | null;

  servicio?: ServicioFlete | null;

  servicios?: ServicioFlete[];

  gruporubro_nombre?: string | null;

  [key: string]: unknown;
};

export type { CatalogoTipo };

export type MonedaFlete = MonedaCatalogo;

export type CarrierOption = {
  /*
   * Sigue siendo compuesto para que dos tarifas
   * de la misma entidad puedan coexistir.
   */
  value: string;

  label: string;

  entidad_id: Id | null;
  entidad_nombre: string;

  cod_rubro: Id | null;
  cod_servicio: Id | null;

  categoria_transporte: string | null;

  flete: number | null;

  nombre_rubro: string;

  tags: string[];
  helper: string[];

  moneda?: string | null;

  servicio: ServicioFlete;
  rubro: RubroFlete;
};

/* ==========================================================================
 * CATEGORÍA
 * ========================================================================== */

export function obtenerCategoriaTransporte({
  servicio,
  categorias,
}: {
  servicio: ServicioFlete;

  categorias: CatalogoTipo[];
}) {
  const metodo = servicio.metodo;

  const nombreDirecto =
    servicio.categoria_transporte_desc ??
    servicio.categoria_transporte_nombre ??
    (metodo?.categoria_transporte_desc as string | undefined) ??
    (metodo?.categoria_transporte_nombre as string | undefined) ??
    "";

  if (String(nombreDirecto).trim()) {
    return String(nombreDirecto).trim().toUpperCase();
  }

  const codCategoria =
    servicio.cod_categoria_transporte ??
    servicio.categoria_transporte ??
    metodo?.cod_categoria_transporte ??
    metodo?.categoria_transporte;

  if (codCategoria == null || codCategoria === "" || String(codCategoria) === "0") {
    return "";
  }

  const categoria = categorias.find(
    (item) => String(item.value ?? item.cod_tipo) === String(codCategoria),
  );

  return String(categoria?.label ?? categoria?.nom_tipo ?? "")
    .trim()
    .toUpperCase();
}

/* ==========================================================================
 * OPCIONES DE CARRIER
 * ========================================================================== */

function buscarTipo(tipos: CatalogoTipo[], value?: Id | null) {
  if (value == null) {
    return null;
  }

  return tipos.find((item) => String(item.value ?? item.cod_tipo) === String(value)) ?? null;
}

export function construirOpcionCarrier({
  servicio,
  rubro,
  categorias,
  tipos,
  monedas,
}: {
  servicio: ServicioFlete;
  rubro: RubroFlete;

  categorias: CatalogoTipo[];
  tipos: CatalogoTipo[];
  monedas: MonedaFlete[];
}): CarrierOption {
  const categoria = obtenerCategoriaTransporte({
    servicio,
    categorias,
  });

  const nombreRubro = String(rubro.nombre_rubro ?? rubro.nombre ?? "");

  const fleteRaw = servicio.metodo?.venta;

  const flete = fleteRaw == null || String(fleteRaw).trim() === "" ? null : Number(fleteRaw);

  const tipoCarga = buscarTipo(tipos, servicio.cod_tipo_carga);

  const clasificacionCarga = buscarTipo(tipos, servicio.cod_clasificacion_carga);

  const moneda = buscarMoneda(monedas, servicio.metodo?.cod_moneda_venta);

  const tags = [
    nombreRubro,
    categoria,
    flete != null ? `FLETE ${flete}` : "",
    tipoCarga?.label,
    clasificacionCarga?.label,
  ]
    .filter(Boolean)
    .map(String);

  const helper = [nombreRubro, categoria, tipoCarga?.label, clasificacionCarga?.label]
    .filter(Boolean)
    .map(String);

  const value = [
    servicio.entidad_id ?? "",
    rubro.cod_rubro ?? "",
    servicio.cod_servicio ?? "",
    servicio.metodo?.cod_metodo ?? "",
  ].join("|");

  return {
    value,

    label: `${servicio.entidad_nombre ?? ""}${tags.length ? ` (${tags.join(" | ")})` : ""}`,

    entidad_id: servicio.entidad_id ?? null,

    entidad_nombre: String(servicio.entidad_nombre ?? ""),

    cod_rubro: rubro.cod_rubro ?? null,

    cod_servicio: servicio.cod_servicio ?? null,

    categoria_transporte: categoria || null,

    flete: Number.isFinite(flete) ? flete : null,

    nombre_rubro: nombreRubro,

    tags,

    helper,

    moneda: moneda?.SIMBOLO_MONEDA ?? moneda?.simbolo_moneda ?? null,

    servicio,
    rubro,
  };
}

export function construirOpcionesCarrier({
  fletes,
  carrierPlantillaId,
  categorias,
  tipos,
  monedas,
}: {
  fletes: RubroFlete[];

  carrierPlantillaId?: Id | null;

  categorias: CatalogoTipo[];
  tipos: CatalogoTipo[];
  monedas: MonedaFlete[];
}) {
  const resultado: CarrierOption[] = [];

  const values = new Set<string>();

  for (const rubro of fletes) {
    const servicios = [...(rubro.servicios ?? [])]
      .filter((servicio) => {
        if (carrierPlantillaId == null) {
          return true;
        }

        return String(servicio.entidad_id) === String(carrierPlantillaId);
      })
      .sort((a, b) => Number(a.entidad_id ?? 0) - Number(b.entidad_id ?? 0));

    for (const servicio of servicios) {
      const opcion = construirOpcionCarrier({
        servicio,
        rubro,
        categorias,
        tipos,
        monedas,
      });

      /*
       * Igual al dedupe antiguo:
       * la identidad real es value.
       */
      if (values.has(opcion.value)) {
        continue;
      }

      values.add(opcion.value);

      resultado.push(opcion);
    }
  }

  return resultado;
}

/* ==========================================================================
 * SERVICIO DE FLETE SELECCIONADO
 * ========================================================================== */

export function obtenerServicioFleteSeleccionado({
  fletes,
  carrier,
}: {
  fletes: RubroFlete[];
  carrier?: CarrierOption | null;
}): ServicioFlete | null {
  if (!carrier) {
    return null;
  }

  const rubro = fletes.find((item) => String(item.cod_rubro) === String(carrier.cod_rubro));

  if (!rubro) {
    return null;
  }

  return (
    (rubro.servicios ?? []).find(
      (servicio) =>
        String(servicio.entidad_id) === String(carrier.entidad_id) &&
        String(servicio.cod_servicio) === String(carrier.cod_servicio),
    ) ?? null
  );
}

/* ==========================================================================
 * CRITERIOS PARA RECÁLCULO DEL CARRIER
 * ========================================================================== */

export function construirCriteriosCarrier({
  criterios,
  carrier,
  servicio,
  valorManual,
}: {
  criterios: Record<string, unknown>;
  carrier: CarrierOption;
  servicio: ServicioFlete;
  valorManual?: string | number | null;
}): Record<string, unknown> | null {
  const nuevoValor = valorManual ?? carrier.flete ?? servicio.metodo?.venta;

  if (nuevoValor == null) {
    return null;
  }

  return {
    ...criterios,
    categoria_transporte: servicio.categoria_transporte ?? null,
    valor_flete: nuevoValor,
  };
}

/*
 * -------------------------------------------------------------------------
 *     Tarifas SPOT
 * -------------------------------------------------------------------------
 */

export function crearTarifaSpotDueCarrier({
  rubroBase,
  valorSpot,
  rateValor,
  valorCw,
  codTipoPago,
  moneda,
  codTipoTransporte,
}: {
  rubroBase?: RubroFlete | null;

  valorSpot: string | number | null;

  rateValor?: string | number | null;

  valorCw?: unknown;

  codTipoPago?: Id | null;

  moneda?: string | null;

  /** Define el texto del detalle de flete (ver lib/detalle-flete.ts). */
  codTipoTransporte?: Id | null | undefined;
}) {
  const valor = Number(valorSpot);

  if (!rubroBase) {
    return null;
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return null;
  }

  const servicioBase = rubroBase.servicio ?? {};

  const metodoBase = servicioBase.metodo ?? rubroBase.metodo ?? {};

  const entidadId = servicioBase.entidad_id ?? rubroBase.entidad_id ?? null;

  const entidadNombre = servicioBase.entidad_nombre ?? rubroBase.entidad_nombre ?? "";

  const codMonedaVenta = metodoBase.cod_moneda_venta ?? null;

  const codMonedaCosto = metodoBase.cod_moneda_costo ?? codMonedaVenta;

  const valueBase =
    rubroBase.value ?? `${rubroBase.cod_rubro}-${servicioBase.cod_servicio}-${entidadId}`;

  const rate = rateValor == null || String(rateValor).trim() === "" ? null : Number(rateValor);

  /*
   * Conservamos esta regla del código actual.
   */
  const esRubroFlete = servicioBase.es_flete === true;

  // Si la tarifa original era un monto fijo (rate = 0), el Spot se muestra como monto fijo.
  const minimo =
    esRubroFlete && Number(rubroBase.metodo?.rate_venta ?? metodoBase.rate_venta) === 0
      ? valor
      : undefined;

  const detalleFlete = construirDetalleFlete(codTipoTransporte, {
    tipo: "spot",
    valorCw,
    simbolo: moneda ?? "",
    rate: rateValor,
    minimo,
  });

  const detalles = [
    // Se quita el detalle generado del flete normal y se agrega el del Spot (si el transporte lleva).
    ...(metodoBase.detalles ?? []).filter((item) => !item.custom),

    ...(detalleFlete ? [detalleFlete] : []),
  ];

  const metodoSpot: MetodoFlete = {
    ...metodoBase,

    venta: valor,

    costo: rubroBase.metodo?.costo ?? valor,

    cod_moneda_venta: codMonedaVenta,

    cod_moneda_costo: codMonedaCosto,

    detalles,

    rate_costo: rubroBase.metodo?.rate_costo ?? rate,

    rate_venta: rate,

    original_rate_costo: rubroBase.metodo?.rate_costo ?? rate,

    original_rate_venta: rubroBase.metodo?.rate_venta ?? rate,

    original_venta: rubroBase.metodo?.venta ?? valor,

    original_costo: rubroBase.metodo?.costo ?? valor,
  };

  const servicioSpot: ServicioFlete = {
    ...servicioBase,

    nombre: servicioBase.nombre ?? servicioBase.nombre_servicio ?? "Flete",

    nombre_servicio: servicioBase.nombre ?? servicioBase.nombre_servicio ?? "Flete",

    entidad_id: entidadId,

    entidad_nombre: entidadNombre,

    metodo: metodoSpot,
  };

  return {
    ...rubroBase,

    value: `${valueBase}-SPOT`,

    cod_detallerubro: null,

    es_flete: true,

    es_tarifa_spot: true,

    nombre: rubroBase.nombre ?? rubroBase.nombre_rubro ?? "Flete",

    nombre_rubro: rubroBase.nombre_rubro ?? rubroBase.nombre ?? "Flete SPOT",

    gruporubro_nombre: "Flete",

    cod_tipo_pago: rubroBase.cod_tipo_pago ?? codTipoPago,

    venta: valor,

    costo: rubroBase.metodo?.costo ?? valor,

    metodo: metodoSpot,

    servicio: servicioSpot,

    cod_servicio: servicioSpot.cod_servicio,

    entidad_id: entidadId,

    entidad_nombre: entidadNombre,
  } as RubroFlete;
}
