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

/** Paso del tracking general (solo visual). */
export type PasoTracking = {
  id: number;
  titulo: string;
  descripcion: string;
};

/** Fila de la tabla de embarques. */
export type EmbarqueMaqueta = {
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
