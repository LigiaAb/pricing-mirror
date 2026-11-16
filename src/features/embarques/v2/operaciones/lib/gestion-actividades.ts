/* ==========================================================================
 * FORMULARIOS DE OPERACIONES (OPS) (SOLO MAQUETA)
 *
 * Cómo se trabaja en pantalla cada actividad de OPS de `ACTIVIDADES_TRACKING`
 * (hoja "Detalle original" del Excel): tipo de interacción, campos propios,
 * texto del botón, referencia contra la que se compara y de qué actividades
 * depende. Los campos `base` del tipo se agregan después de los propios
 * (ver `shared/lib/gestion-actividades.ts`).
 *
 * Todas las actividades de OPS del Excel deben tener entrada aquí (sin
 * entrada se muestra como formulario genérico).
 * ========================================================================== */

import type { DefinicionesGestion } from "../../shared/lib/gestion-actividades";

export const GESTION_OPERACIONES: DefinicionesGestion = {
  /* ---------- Paso 1 · Coordinación y reserva ---------- */
  "OPS 0.1": {
    interaccion: "formulario",
    accion: "Programar recolección",
    campos: [
      { label: "Dirección de recolección", requerido: true },
      { label: "Contacto" },
      { label: "Fecha y hora", tipo: "fecha-hora", requerido: true },
      { label: "Proveedor de transporte", tipo: "catalogo" },
      { label: "Unidad / placa" },
      { label: "Piloto" },
    ],
  },
  "OPS 0.2": { interaccion: "notificacion", accion: "Enviar confirmación", requiere: ["OPS 0.1"] },
  "OPS 0.3": { interaccion: "orden-compra", accion: "Generar OC interna" },
  "OPS 0.4": {
    interaccion: "formulario",
    accion: "Solicitar empaque",
    campos: [
      { label: "Proveedor de empaque", tipo: "catalogo", requerido: true },
      { label: "Tipo de empaque" },
      { label: "Autorización del cliente", tipo: "seleccion", requerido: true, opciones: ["Autorizado", "No autorizado"] },
    ],
  },
  "OPS 0.5": { interaccion: "orden-compra", accion: "Generar OC de empaque", requiere: ["OPS 0.4"] },
  "OPS 1.1": {
    interaccion: "formulario",
    accion: "Asignar HAWB",
    campos: [
      { label: "No. HAWB", requerido: true },
      { label: "Fecha de asignación", tipo: "fecha" },
    ],
  },
  "OPS 1.2": {
    interaccion: "formulario",
    accion: "Registrar MAWB",
    campos: [
      { label: "No. MAWB", requerido: true },
      { label: "Línea aérea", tipo: "catalogo", requerido: true },
      { label: "Booking" },
    ],
  },
  "OPS 1.3": {
    interaccion: "dato-especial",
    accion: "Ingresar correlativo",
    compara: "Último correlativo registrado",
    requiere: ["OPS 1.2"],
    campos: [{ label: "Correlativo MAWB", requerido: true }],
  },
  "OPS 2.1": {
    interaccion: "formulario",
    accion: "Preparar solicitud",
    campos: [
      { label: "Línea aérea / proveedor", tipo: "catalogo", requerido: true },
      { label: "Destino", requerido: true },
      { label: "Fecha de vuelo", tipo: "fecha", requerido: true },
      { label: "Piezas", tipo: "numero", requerido: true },
      { label: "Peso (kg)", tipo: "numero", requerido: true },
      { label: "Dimensiones" },
    ],
  },
  "OPS 2.2": {
    interaccion: "notificacion",
    accion: "Enviar solicitud",
    requiere: ["OPS 2.1"],
    campos: [
      { label: "Tarifa", tipo: "numero" },
      { label: "PP / CC", tipo: "seleccion", requerido: true, opciones: ["PP", "CC"] },
      { label: "EORI" },
      { label: "Partida arancelaria" },
      { label: "Descripción de la mercancía" },
    ],
  },
  "OPS 3.1": {
    interaccion: "confirmacion",
    accion: "Validar reserva",
    compara: "Solicitud de reserva",
    requiere: ["OPS 2.2"],
    campos: [
      { label: "Vuelo", requerido: true },
      { label: "Fecha de vuelo", tipo: "fecha", requerido: true },
      { label: "No. de booking" },
      { label: "Condiciones", tipo: "area" },
    ],
  },
  "OPS 3.2": { interaccion: "notificacion", accion: "Enviar confirmación al cliente", requiere: ["OPS 3.1"] },

  /* ---------- Paso 2 · Documentación y gestión aduanera ---------- */
  "OPS 4.1": {
    interaccion: "documento",
    accion: "Generar draft",
    campos: [
      { label: "Remitente" },
      { label: "Consignatario" },
      { label: "Piezas", tipo: "numero" },
      { label: "Peso (kg)", tipo: "numero" },
      { label: "Destino" },
    ],
    pendiente: "Vista previa del draft.",
  },
  "OPS 4.2": {
    interaccion: "notificacion",
    accion: "Enviar preaviso",
    requiere: ["OPS 4.1"],
    campos: [{ label: "Agente en destino", tipo: "catalogo", requerido: true }],
  },
  "OPS 4.3": {
    interaccion: "orden-compra",
    accion: "Generar OC de pago aéreo",
    compara: "Tarifa negociada",
    requiere: ["OPS 3.1"],
  },
  "OPS 4.4": {
    interaccion: "incidencia",
    accion: "Solicitar anulación",
    campos: [{ label: "Qué se anula", tipo: "seleccion", requerido: true, opciones: ["OC", "Reserva", "OC y reserva"] }],
  },
  "OPS 5.1": {
    interaccion: "notificacion",
    accion: "Solicitar servicio de aduana",
    campos: [{ label: "Agente aduanal", tipo: "catalogo", requerido: true }],
  },
  "OPS 5.2": { interaccion: "orden-compra", accion: "Generar OC de aduana", requiere: ["OPS 5.1"] },
  "OPS 5.3": {
    interaccion: "formulario",
    accion: "Solicitar depósito",
    campos: [
      { label: "Monto", tipo: "numero", requerido: true },
      { label: "Moneda", tipo: "catalogo" },
      { label: "Saldo disponible", tipo: "numero" },
      { label: "Comprobante", tipo: "archivo" },
    ],
  },
  "OPS 5.4": {
    interaccion: "seguimiento",
    compara: "Guía (HAWB / MAWB)",
    campos: [{ label: "No. DUCA" }],
  },

  /* ---------- Paso 3 · Liberación y despacho de bodega ---------- */
  "OPS 6.1": {
    interaccion: "confirmacion",
    accion: "Liberar en sistema",
    requiere: ["OPS 5.4"],
    campos: [{ label: "No. DUCA autorizada", requerido: true }],
  },

  /* ---------- Paso 4 · Recepción en COMBEX y documentación final ---------- */
  "OPS 9.1": {
    interaccion: "dato-especial",
    accion: "Actualizar datos finales",
    compara: "Draft",
    requiere: ["CBX 8.2"],
    campos: [
      { label: "Peso oficial (kg)", tipo: "numero", requerido: true },
      { label: "Peso cobrable (kg)", tipo: "numero" },
      { label: "Piezas", tipo: "numero" },
    ],
  },
  "OPS 9.2": {
    interaccion: "confirmacion",
    accion: "Confirmar tarifas",
    compara: "Cotización",
    campos: [
      { label: "Total costo", tipo: "numero" },
      { label: "Total venta", tipo: "numero" },
      { label: "Profit", tipo: "numero" },
    ],
    pendiente: "Tabla de rubros cotizados (costo / venta) y su confirmación.",
  },
  "OPS 9.3": {
    interaccion: "documento",
    accion: "Emitir guía final",
    requiere: ["OPS 9.1", "OPS 9.2"],
    campos: [{ label: "No. de guía final" }],
  },
  "OPS 9.4": { interaccion: "notificacion", accion: "Notificar al cliente", requiere: ["OPS 9.3"] },
  "OPS 9.5": {
    interaccion: "formulario",
    accion: "Gestionar seguro",
    campos: [
      { label: "Aseguradora", tipo: "catalogo" },
      { label: "Valor asegurable", tipo: "numero", requerido: true },
      { label: "Prima", tipo: "numero" },
      { label: "No. de póliza" },
    ],
  },
  "OPS E2": {
    interaccion: "incidencia",
    accion: "Solicitar CCA",
    campos: [{ label: "Dato original", requerido: true }, { label: "Dato corregido", requerido: true }],
  },

  /* ---------- Paso 5 · Despacho, salida aérea y complementaria ---------- */
  "OPS E1": {
    interaccion: "incidencia",
    accion: "Coordinar nueva reserva",
    campos: [
      { label: "Nueva fecha de vuelo", tipo: "fecha", requerido: true },
      { label: "Nuevo booking" },
    ],
  },

  /* ---------- Paso 6 · Arribo y cierre ---------- */
  "OPS 15": {
    interaccion: "confirmacion",
    accion: "Enviar a facturación",
    campos: [{ label: "¿Cargos pendientes?", tipo: "seleccion", requerido: true, opciones: ["Sí", "No"] }],
  },
  "OPS 16": {
    interaccion: "seguimiento",
    accion: "Actualizar estatus",
    campos: [{ label: "Fecha real del paso", tipo: "fecha" }],
  },
  "OPS 17": {
    interaccion: "orden-compra",
    accion: "Gestionar OC",
    pendiente: "Listado de OC del embarque (recolección, empaque, pago aéreo, aduana).",
  },
};
