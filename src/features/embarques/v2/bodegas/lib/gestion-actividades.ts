/* ==========================================================================
 * FORMULARIOS DE BODEGAS (SOLO MAQUETA)
 *
 * Cómo se trabaja en pantalla cada actividad de Bodega de `ACTIVIDADES_TRACKING`
 * (hoja "Detalle original" del Excel): tipo de interacción, campos propios,
 * texto del botón, referencia contra la que se compara y de qué actividades
 * depende. Los campos `base` del tipo se agregan después de los propios
 * (ver `shared/lib/gestion-actividades.ts`).
 *
 * Todas las actividades de Bodega del Excel deben tener entrada aquí (sin
 * entrada se muestra como formulario genérico).
 * ========================================================================== */

import type { DefinicionesGestion } from "../../shared/lib/gestion-actividades";
import type { CampoGestion } from "../../shared/lib/interacciones";

const PESO_MEDIDAS: readonly CampoGestion[] = [
  { label: "Peso (kg)", tipo: "numero", requerido: true },
  { label: "Largo", tipo: "numero" },
  { label: "Alto", tipo: "numero" },
  { label: "Ancho", tipo: "numero" },
];

export const GESTION_BODEGAS: DefinicionesGestion = {
  /* ---------- Paso 1 · Coordinación y reserva ---------- */
  "Bodega 0.1": {
    interaccion: "confirmacion",
    accion: "Confirmar recepción",
    campos: [{ label: "Piezas recibidas", tipo: "numero", requerido: true }],
  },
  "Bodega 0.2": {
    interaccion: "dato-especial",
    accion: "Registrar repeso",
    compara: "Peso declarado",
    campos: [{ label: "Peso (kg)", tipo: "numero", requerido: true }],
  },
  "Bodega 0.3": {
    interaccion: "dato-especial",
    accion: "Registrar medidas",
    compara: "Dimensiones declaradas",
    campos: PESO_MEDIDAS.slice(1),
  },
  "Bodega 0.4": {
    interaccion: "confirmacion",
    accion: "Confirmar empaque",
    requiere: ["OPS 0.4"],
    campos: [{ label: "Resultado de la revisión", tipo: "seleccion", requerido: true, opciones: ["Conforme", "Con observaciones", "No conforme"] }],
  },
  "Bodega 0.5": {
    interaccion: "dato-especial",
    accion: "Actualizar e informar a OPS",
    compara: "Peso y medidas antes del empaque",
    requiere: ["Bodega 0.4"],
    campos: PESO_MEDIDAS,
  },

  /* ---------- Paso 3 · Liberación y despacho de bodega ---------- */
  "Bodega 7.1": {
    interaccion: "confirmacion",
    accion: "Validar recepción",
    campos: [
      { label: "Piezas recibidas", tipo: "numero", requerido: true },
      { label: "Estado físico", tipo: "seleccion", requerido: true, opciones: ["Buen estado", "Con daños"] },
    ],
  },
  "Bodega 7.2": {
    interaccion: "dato-especial",
    accion: "Registrar repeso y medidas",
    compara: "Peso y medidas del draft",
    campos: PESO_MEDIDAS,
  },
  "Bodega 7.3": {
    interaccion: "documento",
    accion: "Imprimir etiquetas",
    campos: [{ label: "Cantidad de etiquetas", tipo: "numero" }],
  },
  "Bodega 7.4": { interaccion: "documento", accion: "Imprimir manifiesto" },
  "Bodega 7.5": { interaccion: "evidencia" },
  "Bodega 7.6": {
    interaccion: "formulario",
    accion: "Asignar unidad",
    campos: [
      { label: "Proveedor", tipo: "catalogo", requerido: true },
      { label: "Placa", requerido: true },
      { label: "Piloto", requerido: true },
      { label: "Fecha y hora", tipo: "fecha-hora" },
    ],
  },
  "Bodega 7.7": {
    interaccion: "documento",
    accion: "Generar pase de salida",
    requiere: ["OPS 6.1"],
    campos: [{ label: "No. de pase" }],
  },
  "Bodega 7.8": {
    interaccion: "confirmacion",
    accion: "Confirmar despacho",
    requiere: ["Bodega 7.7"],
    campos: [
      { label: "Transportista" },
      { label: "Firma o evidencia de recepción", tipo: "archivo", requerido: true },
    ],
  },
  "Bodega 7.9": {
    interaccion: "confirmacion",
    accion: "Descargar inventario",
    compara: "Piezas en inventario",
    requiere: ["Bodega 7.8"],
    campos: [{ label: "Piezas despachadas", tipo: "numero", requerido: true }],
  },
  "Bodega E1": {
    interaccion: "incidencia",
    accion: "Detener despacho e informar a OPS",
    campos: [{ label: "Diferencia en", tipo: "seleccion", requerido: true, opciones: ["Piezas", "Peso", "Medidas"] }],
  },
  "Bodega E2": {
    interaccion: "incidencia",
    accion: "Escalar caso",
    campos: [{ label: "Fotografías del daño", tipo: "archivo", requerido: true, acepta: "image/*" }],
  },
};
