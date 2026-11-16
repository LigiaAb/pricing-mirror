/* ==========================================================================
 * TIPOS DE INTERACCIÓN (SOLO MAQUETA)
 *
 * Cada actividad del tracking se trabaja con uno de estos tipos. Todas las
 * tabs se arman con las mismas piezas: así una confirmación, un correo o una
 * OC se ven igual en cualquier paso.
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
  /** Nombre del tipo (chip en la tarjeta y leyenda). */
  label: string;
  /** Para qué se usa (leyenda). */
  descripcion: string;
  /** Texto del botón cuando la actividad no define el suyo. */
  accion: string;
  base: readonly CampoGestion[];
};

export const INTERACCIONES: Record<TipoInteraccion, DefinicionInteraccion> = {
  formulario: {
    label: "Formulario",
    descripcion: "Registro de datos de la actividad.",
    accion: "Guardar",
    base: [{ label: "Observaciones", tipo: "area" }],
  },
  "dato-especial": {
    label: "Dato especial",
    descripcion: "Pesos, medidas o correlativos que se comparan contra una referencia.",
    accion: "Registrar",
    base: [],
  },
  confirmacion: {
    label: "Confirmación",
    descripcion: "Verificar y dejar constancia de quién confirmó y cuándo.",
    accion: "Confirmar",
    base: [
      { label: "Fecha y hora", tipo: "fecha-hora", requerido: true },
      { label: "Confirmado por" },
    ],
  },
  notificacion: {
    label: "Correo",
    descripcion: "Envío de correo al cliente, destino o proveedor; queda como evidencia.",
    accion: "Enviar correo",
    base: [
      { label: "Destinatarios", requerido: true },
      { label: "Asunto" },
      { label: "Fecha y hora de envío", tipo: "fecha-hora" },
      { label: "Adjuntos", tipo: "archivo" },
    ],
  },
  "orden-compra": {
    label: "Orden de compra",
    descripcion: "OC relacionada con el embarque.",
    accion: "Generar OC",
    base: [
      { label: "Proveedor", tipo: "seleccion", requerido: true },
      { label: "No. OC" },
      { label: "Monto", tipo: "numero", requerido: true },
      { label: "Moneda", tipo: "seleccion" },
    ],
  },
  documento: {
    label: "Documento",
    descripcion: "Generar, emitir o imprimir un documento.",
    accion: "Generar",
    base: [{ label: "Fecha", tipo: "fecha" }],
  },
  evidencia: {
    label: "Evidencia",
    descripcion: "Fotografías de la carga.",
    accion: "Subir fotografías",
    base: [{ label: "Fotografías", tipo: "archivo", requerido: true }],
  },
  seguimiento: {
    label: "Seguimiento",
    descripcion: "Estado de un trámite hasta que concluye.",
    accion: "Actualizar seguimiento",
    base: [
      { label: "Estado", tipo: "seleccion", requerido: true },
      { label: "Fecha", tipo: "fecha" },
      { label: "Observaciones", tipo: "area" },
    ],
  },
  incidencia: {
    label: "Incidencia",
    descripcion: "Excepción: se registra con motivo y autorización.",
    accion: "Registrar incidencia",
    base: [
      { label: "Motivo", requerido: true },
      { label: "Autorizado por" },
      { label: "Detalle", tipo: "area" },
    ],
  },
};
