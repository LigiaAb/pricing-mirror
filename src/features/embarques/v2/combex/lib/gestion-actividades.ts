/* ==========================================================================
 * FORMULARIOS DE COMBEX (CBX) (SOLO MAQUETA)
 *
 * Cómo se trabaja en pantalla cada actividad de CBX de `ACTIVIDADES_TRACKING`
 * (hoja "Detalle original" del Excel): tipo de interacción, campos propios,
 * texto del botón, referencia contra la que se compara y de qué actividades
 * depende. Los campos `base` del tipo se agregan después de los propios
 * (ver `shared/lib/gestion-actividades.ts`).
 *
 * Todas las actividades de CBX del Excel deben tener entrada aquí (sin
 * entrada se muestra como formulario genérico).
 * ========================================================================== */

import type { DefinicionesGestion } from "../../shared/lib/gestion-actividades";

export const GESTION_COMBEX: DefinicionesGestion = {
  /* ---------- Paso 2 · Documentación y gestión aduanera ---------- */
  "CBX E1": {
    interaccion: "incidencia",
    accion: "Solicitar saldo",
    campos: [{ label: "Monto", tipo: "numero", requerido: true }],
  },

  /* ---------- Paso 4 · Recepción en COMBEX y documentación final ---------- */
  "CBX 8.1": { interaccion: "confirmacion", accion: "Confirmar entrega en terminal" },
  "CBX 8.2": {
    interaccion: "dato-especial",
    accion: "Registrar peso oficial",
    compara: "Peso de bodega",
    requiere: ["CBX 8.1"],
    campos: [
      { label: "Peso oficial (kg)", tipo: "numero", requerido: true },
      { label: "Volumen (m³)", tipo: "numero" },
    ],
  },
  "CBX 8.3": {
    interaccion: "formulario",
    accion: "Registrar pago de boleta",
    requiere: ["CBX 8.2"],
    campos: [
      { label: "No. de boleta", requerido: true },
      { label: "Monto", tipo: "numero" },
      { label: "Comprobante", tipo: "archivo", requerido: true },
    ],
  },
  "CBX 8.4": { interaccion: "evidencia" },
  "CBX 8.5": {
    interaccion: "notificacion",
    accion: "Informar al cliente",
    requiere: ["CBX 8.2", "CBX 8.4"],
  },
  "CBX 10.1": {
    interaccion: "documento",
    accion: "Adjuntar hojas de seguridad",
    campos: [
      { label: "Hojas de seguridad", tipo: "archivo", requerido: true },
      { label: "Vigencia", tipo: "fecha" },
    ],
  },
  "CBX 10.2": {
    interaccion: "documento",
    accion: "Imprimir guías",
    requiere: ["OPS 9.3"],
    campos: [{ label: "Copias", tipo: "numero" }],
  },
  "CBX 10.3": { interaccion: "documento", accion: "Imprimir manifiestos", requiere: ["OPS 9.3"] },
  "CBX 10.4": {
    interaccion: "documento",
    accion: "Imprimir ND de destino",
    campos: [{ label: "Destinatario" }, { label: "Monto", tipo: "numero" }],
  },
  "CBX 10.5": {
    interaccion: "documento",
    accion: "Imprimir NC de profit",
    requiere: ["OPS 9.2"],
    campos: [{ label: "Monto", tipo: "numero" }],
  },

  /* ---------- Paso 5 · Despacho, salida aérea y complementaria ---------- */
  "CBX 11.1": { interaccion: "notificacion", accion: "Notificar carga a despachar" },
  "CBX 12.1": {
    interaccion: "confirmacion",
    accion: "Confirmar salida",
    compara: "Reserva confirmada",
    campos: [
      { label: "Vuelo real", requerido: true },
      {
        key: "fechas.fecha_salida_real",
        label: "Fecha y hora de salida real",
        tipo: "fecha-hora",
        requerido: true,
      },
    ],
  },
  "CBX 12.2": {
    interaccion: "notificacion",
    accion: "Solicitar complementaria",
    requiere: ["CBX 12.1"],
  },
  "CBX 12.3": {
    interaccion: "notificacion",
    accion: "Enviar aviso al cliente",
    requiere: ["CBX 12.1"],
  },
  "CBX 12.4": {
    interaccion: "notificacion",
    accion: "Enviar aviso a destino",
    requiere: ["CBX 12.1"],
  },
  "CBX 13.1": { interaccion: "seguimiento", requiere: ["CBX 12.2"] },
  "CBX 13.2": {
    interaccion: "notificacion",
    accion: "Notificar conclusión",
    requiere: ["CBX 13.1"],
    campos: [{ label: "Documento final", tipo: "archivo", requerido: true }],
  },
  "CBX E2": {
    interaccion: "incidencia",
    accion: "Informar no salida",
    campos: [{ key: "fechas.fecha_nueva_salida", label: "Nueva fecha", tipo: "fecha" }],
  },
  "CBX E3": {
    interaccion: "incidencia",
    accion: "Informar incidencia",
    campos: [
      {
        label: "Tipo",
        tipo: "seleccion",
        requerido: true,
        opciones: ["Cambio", "Cancelación", "Descarga"],
      },
    ],
  },
  "CBX E4": {
    interaccion: "seguimiento",
    requiere: ["OPS E2"],
    campos: [{ label: "Confirmación de recepción en destino", tipo: "fecha" }],
  },

  /* ---------- Paso 6 · Arribo y cierre ---------- */
  "CBX 14.1": {
    interaccion: "confirmacion",
    accion: "Confirmar arribo",
    campos: [
      {
        key: "fechas.fecha_llegada_real",
        label: "Fecha y hora de llegada",
        tipo: "fecha-hora",
        requerido: true,
      },
    ],
  },
};
