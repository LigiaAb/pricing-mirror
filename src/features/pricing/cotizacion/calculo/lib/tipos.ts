/* ==========================================================================
 * TIPOS COMPARTIDOS DE COTIZACIONES
 *
 * Único lugar donde se declaran los tipos que usan varias partes del módulo.
 *
 * - ¿Nuevo catálogo?  → agrega su tipo aquí y regístralo en
 *                       `hooks/use-catalogos-cotizacion.tsx`.
 * - ¿Nuevo campo en un catálogo existente? → agrégalo aquí; todos los
 *                       archivos que lo usan lo verán automáticamente.
 *
 * Los tipos que solo usa un archivo pueden seguir viviendo en ese archivo.
 * ========================================================================== */

/** Identificador del backend (puede venir como texto o número). */
export type Id = string | number;

/** Objeto genérico con llaves desconocidas. */
export type Registro = Record<string, unknown>;

/* ==========================================================================
 * OPCIONES DE SELECT
 * ========================================================================== */

/** Opción normalizada { value, label } que consumen los selects / combobox. */
export type OpcionCatalogo = {
  value: Id;
  label: string;

  [key: string]: unknown;
};

/* ==========================================================================
 * CATÁLOGOS
 * ========================================================================== */

export type MonedaCatalogo = {
  cod_moneda: Id;

  simbolo_moneda?: string | null;
  SIMBOLO_MONEDA?: string | null;
  nom_moneda?: string | null;
  simbolo?: string | null;
  nombre?: string | null;

  [key: string]: unknown;
};

export type RubroCatalogo = {
  cod_rubro?: Id | null;

  nombre?: string | null;
  nombre_rubro?: string | null;
  label?: string | number | null;

  es_flete?: boolean | null;

  [key: string]: unknown;
};

export type ServicioCatalogo = {
  cod_servicio?: Id | null;

  nombre_servicio?: string | null;
  nombre?: string | null;
  siglas?: string | null;

  clasificacion?: Id | null;
  servicio_clasificacion?: Id | null;

  entidad_id?: Id | null;
  cod_rubro?: Id | null;

  [key: string]: unknown;
};

export type MetodoCatalogo = {
  cod_servicio?: Id | null;
  fecha_final?: Date | string | null;

  [key: string]: unknown;
};

/** Proveedor / cliente / carrier. */
export type EntidadCatalogo = {
  value?: Id | null;
  id?: Id | null;
  entidad_id?: Id | null;
  cod_entidad?: Id | null;

  entidad_nombre?: string | null;
  razon_social?: string | null;
  nombre?: string | null;
  label?: string | number | null;

  [key: string]: unknown;
};

/** Registro de la tabla de tipos genérica (categorías, tipos de carga, ...). */
export type CatalogoTipo = {
  value?: Id | null;
  cod_tipo?: Id | null;

  label?: string | number | null;
  nom_tipo?: string | null;
};

/** Unidad de medida/peso: definida en la calculadora de embarques (pricing/shared). */
export type { Unidad } from "@/features/pricing/shared";

export type PuntoEnlaceCatalogo = {
  value: Id;
  label: string;

  cod_puntoenlace?: Id | null;
  codigo?: string | null;
  tipo_descripcion?: string | null;

  [key: string]: unknown;
};

/** Catálogo general de criterios (cod_criterio + campo). */
export type CriterioCatalogo = {
  cod_criterio?: Id | null;
  campo?: string | null;

  [key: string]: unknown;
};

export type ReasonCodeSpot = OpcionCatalogo;

/** Opción de un criterio dinámico (equipo, commodity, ...). */
export type OpcionCriterio = {
  value: unknown;
  label: string;

  [key: string]: unknown;
};
