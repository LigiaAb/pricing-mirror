/* ==========================================================================
 * TIPOS DE INTERACCIÓN (SOLO MAQUETA)
 *
 * Cada actividad del tracking se trabaja con uno de estos tipos. Todas las
 * tabs se arman con las mismas piezas: así una confirmación, un correo o una
 * OC se ven igual en cualquier paso.
 *
 * USO INTERNO: el tipo NO se muestra al usuario (solo define icono, campos
 * base y texto del botón). En pantalla se ve la actividad y su botón.
 *
 * `base` = campos que lleva siempre ese tipo; la actividad agrega los suyos
 * antes (ver `gestion-actividades.ts`).
 * ========================================================================== */

export type TipoInteraccion =
  | "formulario"
  | "dato-especial"
  | "confirmacion"
  | "notificacion"
  | "orden-compra"
  | "documento"
  | "evidencia"
  | "seguimiento"
  | "incidencia";

export type TipoCampo = "texto" | "numero" | "fecha" | "fecha-hora" | "seleccion" | "area" | "archivo";

export type CampoGestion = {
  label: string;
  tipo?: TipoCampo;
  requerido?: boolean;
};

export type DefinicionInteraccion = {
  /** Texto del botón cuando la actividad no define el suyo. */
  accion: string;
  base: readonly CampoGestion[];
};

export const INTERACCIONES: Record<TipoInteraccion, DefinicionInteraccion> = {
  /** Registro de datos de la actividad. */
  formulario: {
    accion: "Guardar",
    base: [{ label: "Observaciones", tipo: "area" }],
  },
  /** Pesos, medidas o correlativos que se comparan contra una referencia. */
  "dato-especial": {
    accion: "Registrar",
    base: [],
  },
  /** Verificar y dejar constancia de quién confirmó y cuándo. */
  confirmacion: {
    accion: "Confirmar",
    base: [
      { label: "Fecha y hora", tipo: "fecha-hora", requerido: true },
      { label: "Confirmado por" },
    ],
  },
  /** Correo al cliente, destino o proveedor; queda como evidencia. */
  notificacion: {
    accion: "Enviar correo",
    base: [
      { label: "Destinatarios", requerido: true },
      { label: "Asunto" },
      { label: "Fecha y hora de envío", tipo: "fecha-hora" },
      { label: "Adjuntos", tipo: "archivo" },
    ],
  },
  /** OC relacionada con el embarque. */
  "orden-compra": {
    accion: "Generar OC",
    base: [
      { label: "Proveedor", tipo: "seleccion", requerido: true },
      { label: "No. OC" },
      { label: "Monto", tipo: "numero", requerido: true },
      { label: "Moneda", tipo: "seleccion" },
    ],
  },
  /** Generar, emitir o imprimir un documento. */
  documento: {
    accion: "Generar",
    base: [{ label: "Fecha", tipo: "fecha" }],
  },
  /** Fotografías de la carga. */
  evidencia: {
    accion: "Subir fotografías",
    base: [{ label: "Fotografías", tipo: "archivo", requerido: true }],
  },
  /** Estado de un trámite hasta que concluye. */
  seguimiento: {
    accion: "Actualizar seguimiento",
    base: [
      { label: "Estado", tipo: "seleccion", requerido: true },
      { label: "Fecha", tipo: "fecha" },
      { label: "Observaciones", tipo: "area" },
    ],
  },
  /** Excepción: se registra con motivo y autorización. */
  incidencia: {
    accion: "Registrar incidencia",
    base: [
      { label: "Motivo", requerido: true },
      { label: "Autorizado por" },
      { label: "Detalle", tipo: "area" },
    ],
  },
};
