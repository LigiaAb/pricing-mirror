/* ==========================================================================
 * CÓDIGOS DE NEGOCIO DE COTIZACIONES
 *
 * Valores fijos de la base de datos que el código usa para tomar decisiones.
 * Antes estaban escritos como números sueltos (127, 134, 356...) en muchos
 * archivos. Si un código cambia o necesitas uno nuevo, se cambia AQUÍ.
 * ========================================================================== */

/** cod_tipo_transporte */
export const TIPO_TRANSPORTE = {
  AEREO: 49,
  MARITIMO: 50,
  TERRESTRE: 51,
} as const;

/** cod_tipo_pago */
export const TIPO_PAGO = {
  /** Collect (letra "C"). También exige estación en el formulario. */
  COLLECT: 127,
  /** Prepaid (letra "P"). */
  PREPAID: 128,
  /** Todos / ambos: cada rubro elige Prepaid o Collect. */
  TODOS: 131,
} as const;

/** cod_tipo_calculo del método */
export const TIPO_CALCULO = {
  /** Due Carrier calculado a partir del total de Due Agent. */
  DUE_AGENT: 90,
  /** Abierto: el usuario ingresa el valor manualmente. */
  ABIERTO: 340,
  /** Cobertura de mercadería (usa valor_factura). */
  COBERTURA_MERCADERIA: 356,
} as const;

/** cod_tipo_metodo */
export const TIPO_METODO = {
  COSTO_PORCENTAJE: 504,
} as const;

/** cod_rubro */
export const RUBRO = {
  IVA: 133,
  SCALLING: 134,
} as const;

/** cod_tipo_servicio que maneja estación y PDFs prepaid/collect. */
export const COD_TIPO_SERVICIO_ESTACION = 81;

/** cod_criterio que solo se muestra cuando el servicio es express. */
export const COD_CRITERIO_EXPRESS = 13;

/** Entidad (proveedor) con la que se consultan las tarifas de Due Agent. */
export const COD_ENTIDAD_DUE_AGENT = 13624;

/** Estado de cabecera que el sistema anterior ocultaba en el listado. */
export const COD_ESTADO_OCULTO_LEGADO = 67;

/** Unidades por defecto de la calculadora de medidas. */
export const UNIDAD_DEFAULT = {
  /** Unidad de volumen / medida. */
  MEDIDA: 165,
  /** Unidad de peso. */
  PESO: 162,
} as const;

/** Ubicación por defecto para aeropuertos en Guatemala. */
export const COD_PAIS_GUATEMALA = 1001;
export const COD_PUNTO_ENLACE_GUA = 2227;
