/* ==========================================================================
 * TIPOS DE LA VISTA GENERAL DE EMBARQUES (MAQUETA)
 *
 * Solo maquetado: estos tipos describen lo que la pantalla muestra hoy con
 * datos de ejemplo. Cuando exista la API, se reemplazan por los del backend
 * (o se adaptan en un `map` de la api), sin tocar los componentes.
 * ========================================================================== */

/** Pantallas que van a compartir esta vista (cada una ve sus pasos). */
export type PerfilEmbarque = "operaciones" | "bodegas" | "combex";

/** Estado visual de un paso del tracking. */
export type EstadoPaso = "completado" | "actual" | "pendiente";

/** Áreas que ejecutan actividades del tracking (columna "Responsable" del Excel). */
export type ResponsableTracking = "OPS" | "Bodega" | "CBX";

/** Paso del tracking general (solo visual). */
export type PasoTracking = {
  id: number;
  /** Nombre corto para el círculo del tracking y la tabla. */
  corto: string;
  /** Estado consolidado (nombre completo del paso). */
  titulo: string;
  /** Alcance del paso. */
  alcance: string;
  /** Áreas con actividades en el paso. */
  responsables: readonly ResponsableTracking[];
};

/**
 * Datos de la coordinación que usa el tracking interactivo (`TrackingDetalle`).
 * Mismos nombres y tipos que `Coordinacion` del proyecto: una fila real de la
 * tabla se puede pasar tal cual.
 */
export type CoordinacionTracking = {
  coordinacion: string | number;
  cod_file: string;
  estadoId: string | number;
  seg_coord_id?: number;
  estado_id_tracking?: number;
};

/** Fila de la tabla de embarques. */
export type EmbarqueMaqueta = CoordinacionTracking & {
  codFile: string;
  id: number;
  cliente: string;
  tipoTransporte: string;
  origen: string;
  destino: string;
  carrier: string;
  etd: string;
  eta: string;
  estado: string;
  /** Paso del tracking en el que va (1..6). */
  pasoActual: number;
};

/**
 * Valores de la tab Información por `key` de `shared/lib/campos-embarque.ts`
 * (mismo nombre del dato que en el módulo actual). Casillas = lista.
 */
export type ValoresEmbarque = Readonly<Record<string, string | readonly string[] | undefined>>;

/**
 * Información del embarque (tab Información), por sección del módulo actual.
 * Producto, Rutas y Fechas de movimiento son listas (cada carga, tramo y fecha).
 */
export type InformacionEmbarque = {
  shipper: ValoresEmbarque;
  consignatario: ValoresEmbarque;
  facturacion: ValoresEmbarque;
  detalles: ValoresEmbarque;
  cargas: readonly ValoresEmbarque[];
  rutas: readonly ValoresEmbarque[];
  /** `fecha_recoleccion` y demás fechas que no son lista. */
  fechaRecoleccion: ValoresEmbarque;
  fechas: readonly ValoresEmbarque[];
};

/**
 * Archivo del embarque (tab Archivos, solo consulta y descarga).
 * Se sube en la actividad que lo pide (`origen: "actividad"`) o en el
 * tracking interactivo (`origen: "tracking"`); no hay subida general.
 */
export type ArchivoEmbarque = {
  id: number;
  nombre: string;
  /** Tipo de documento (ej. "Guía aérea", "Fotografía"). */
  tipo: string;
  origen: "actividad" | "tracking";
  /** Id de la actividad (`ACTIVIDADES_TRACKING`) si `origen` es `"actividad"`. */
  actividad?: string | undefined;
  /** Paso del tracking (1..6) en que se subió. */
  paso: number;
  usuario: string;
  fecha: string;
};
