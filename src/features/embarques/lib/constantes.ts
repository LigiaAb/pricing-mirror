/**
 * Constantes de negocio del módulo de embarques.
 * Fuente: docs/PLAN-PARIDAD-CTS-GESTION-EMBARQUES.md §8.
 */

/** Estado de coordinación en CTS (pendiente de crear coordinación). */
export const ESTADO_CTS = 75;

/** Estado de coordinación tras "Crear Coordinación". */
export const ESTADO_COORDINACION_CREADA = 40;

/** Estados que muestra el filtro "CTS" en gestión de embarques. */
export const ESTADOS_GESTION_CTS: readonly number[] = [ESTADO_CTS];

/** Estados que muestra el filtro "Confirmadas" en gestión de embarques. */
export const ESTADOS_CONFIRMADAS: readonly number[] = [70, 71, 72, 73, 66, 67];

/** `cod_estado` de la carta de instrucciones mientras el cliente no completa sus datos. */
export const COD_ESTADO_CARTA_INCOMPLETA = 1;

/** Contexto operativo fijo con el que opera el módulo de embarques. */
export const COD_MODULO_EMBARQUES = 12;
export const COD_CC_EMBARQUES = 16;
export const COD_EMPRESA_EMBARQUES = 1;

/** id_servicio "Consolidado": único servicio que asigna guía al crear la coordinación. */
export const ID_SERVICIO_CONSOLIDADO = 10;

/** id_tipo_fecha de "FECHA DE RECOLECCION" en coordinacion-fecha-mov. */
export const TIPO_FECHA_RECOLECCION = 266;

/** id_tipo_fecha de "Fecha de entrega COMBEX" en coordinacion-fecha-mov. */
export const TIPO_FECHA_ENTREGA_COMBEX = 324;

/** cod_tipo de la relación entidad-cliente ⇆ shipper/consignatario. */
export const REL_ENTIDAD_CLIENTE = 300;

/** Subtipos de dirección en el maestro de direcciones de la entidad. */
export const DIRECCION_TIPO = {
  recoleccion: 145,
  facturacion: 12,
  fiscal: 11,
} as const;

/** cod_tipo por rol de entidad. */
export const TIPO_ENTIDAD = {
  shipper: 155,
  consignatario: 156,
  cliente: 3,
  preCliente: 5,
} as const;

/** cod_identificacion del NIT según el rol de la entidad. */
export const NIT_COD_IDENTIFICACION = {
  shipper: 46,
  consignatario: 49,
  cliente: 3,
} as const;

/** La sección "Fechas" solo aplica si algún gasto tiene este rubro. */
export const COD_RUBRO_FECHAS = 12;

/** La sección de documentos CROPA solo aplica si algún gasto tiene este rubro. */
export const COD_RUBRO_DOCS_CROPA = 127;

/**
 * cod_tipo de actividades de Seguimiento en el detalle CTS. El legacy nuevo
 * usa 35 (la versión anterior de esta vista usaba 319) — divergencia anotada
 * en el plan de paridad §9, pendiente de confirmar con negocio.
 */
export const SEGUIMIENTO_COD_TIPO_CTS = 35;

/** `cod_estado` de la carta al completar la gestión pública. */
export const COD_ESTADO_CARTA_COMPLETADA = 83;

/** cod_tipo_documento del "Formulario Instructivo Firmado por el cliente". */
export const COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO = 256;

/**
 * cod_tipo de la clasificación de carga PELIGROSA: dispara la exigencia de la
 * Hoja de Seguridad MSDS (reemplaza al checkbox "S" de peligrosidad).
 */
export const CLASIFICACION_CARGA_PELIGROSA = 122;

/** cod_tipo_documento de la "Hoja de Seguridad" (MSDS). */
export const TIPO_DOCUMENTO_HOJA_SEGURIDAD = 343;

/** cod_tipo_documento de la "Factura Cobertura Seguro". */
export const TIPO_DOCUMENTO_FACTURA_COBERTURA_SEGURO = 315;

/** Tamaño máximo (MB) de los PDF en los dropzones de documentos. */
export const MAX_FILE_SIZE_MB = 10;

/** Documentos CROPA que se marcan en la sección Detalles (CTS y gestión-embarques). */
export const CROPA_DOCS = [
  { key: "deprex", label: "Deprex", tipoDocumentoId: 219 },
  { key: "dua_complementaria", label: "DUA Complementaria", tipoDocumentoId: 263 },
  { key: "dua_definitiva", label: "DUA Definitiva", tipoDocumentoId: 265 },
  { key: "dua_simplificada", label: "DUA Simplificada", tipoDocumentoId: 264 },
  { key: "otros", label: "Otros", tipoDocumentoId: 157 },
];
