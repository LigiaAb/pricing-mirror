/* ==========================================================================
 * TOTALES DE RUBROS — TIPOS
 * ========================================================================== */

import type { Id, MonedaCatalogo } from "../tipos";

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

export type ElementoAgrupado = RubroTotal & {
  __tipo?: "ITEM" | "GRUPO";

  __idDeGrupo?: number;

  __codMoneda?: Id | "SIN_MONEDA";
};
