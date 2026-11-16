/* ==========================================================================
 * GESTIÓN DE CADA ACTIVIDAD (SOLO MAQUETA)
 *
 * Cómo se trabaja en pantalla cada actividad de `ACTIVIDADES_TRACKING`
 * (hoja "Detalle original" del Excel): tipo de interacción, campos propios,
 * texto del botón, referencia contra la que se compara y de qué actividades
 * depende. Los campos `base` del tipo se agregan después de los propios.
 *
 * Todas las actividades del Excel deben tener entrada aquí (sin entrada se
 * muestra como formulario genérico).
 * ========================================================================== */

import type { CampoGestion, TipoInteraccion } from "./interacciones";
import { INTERACCIONES } from "./interacciones";

export type GestionActividad = {
  interaccion: TipoInteraccion;
  campos?: readonly CampoGestion[];
  /** Texto del botón (si no, el del tipo de interacción). */
  accion?: string;
  /** Referencia contra la que se compara (control del Excel). */
  compara?: string;
  /** Ids de actividades que deben estar hechas antes. */
  requiere?: readonly string[];
  /** Parte que aún no se maqueta en detalle. */
  pendiente?: string;
};

const PESO_MEDIDAS: readonly CampoGestion[] = [
  { label: "Peso (kg)", tipo: "numero", requerido: true },
  { label: "Largo (cm)", tipo: "numero" },
  { label: "Ancho (cm)", tipo: "numero" },
  { label: "Alto (cm)", tipo: "numero" },
];

export const GESTION_ACTIVIDADES: Record<string, GestionActividad> = {
  /* ---------- Paso 1 · Coordinación y reserva ---------- */
  "OPS 0.1": {
    interaccion: "formulario",
    accion: "Programar recolección",
    campos: [
      { label: "Dirección de recolección", requerido: true },
      { label: "Contacto" },
      { label: "Fecha y hora", tipo: "fecha-hora", requerido: true },
      { label: "Proveedor de transporte", tipo: "seleccion" },
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
      { label: "Proveedor de empaque", tipo: "seleccion", requerido: true },
      { label: "Tipo de empaque" },
      { label: "Autorización del cliente", tipo: "seleccion", requerido: true },
    ],
  },
  "OPS 0.5": { interaccion: "orden-compra", accion: "Generar OC de empaque", requiere: ["OPS 0.4"] },
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
    campos: [{ label: "Resultado de la revisión", tipo: "seleccion", requerido: true }],
  },
  "Bodega 0.5": {
    interaccion: "dato-especial",
    accion: "Actualizar e informar a OPS",
    compara: "Peso y medidas antes del empaque",
    requiere: ["Bodega 0.4"],
    campos: PESO_MEDIDAS,
  },
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
      { label: "Línea aérea", tipo: "seleccion", requerido: true },
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
      { label: "Línea aérea / proveedor", tipo: "seleccion", requerido: true },
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
      { label: "PP / CC", tipo: "seleccion", requerido: true },
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
    campos: [{ label: "Agente en destino", tipo: "seleccion", requerido: true }],
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
    campos: [{ label: "Qué se anula (OC / reserva)", tipo: "seleccion", requerido: true }],
  },
  "OPS 5.1": {
    interaccion: "notificacion",
    accion: "Solicitar servicio de aduana",
    campos: [{ label: "Agente aduanal", tipo: "seleccion", requerido: true }],
  },
  "OPS 5.2": { interaccion: "orden-compra", accion: "Generar OC de aduana", requiere: ["OPS 5.1"] },
  "OPS 5.3": {
    interaccion: "formulario",
    accion: "Solicitar depósito",
    campos: [
      { label: "Monto", tipo: "numero", requerido: true },
      { label: "Moneda", tipo: "seleccion" },
      { label: "Saldo disponible", tipo: "numero" },
      { label: "Comprobante", tipo: "archivo" },
    ],
  },
  "OPS 5.4": {
    interaccion: "seguimiento",
    compara: "Guía (HAWB / MAWB)",
    campos: [{ label: "No. DUCA" }],
  },
  "CBX E1": {
    interaccion: "incidencia",
    accion: "Solicitar saldo",
    campos: [{ label: "Monto", tipo: "numero", requerido: true }],
  },

  /* ---------- Paso 3 · Liberación y despacho de bodega ---------- */
  "OPS 6.1": {
    interaccion: "confirmacion",
    accion: "Liberar en sistema",
    requiere: ["OPS 5.4"],
    campos: [{ label: "No. DUCA autorizada", requerido: true }],
  },
  "Bodega 7.1": {
    interaccion: "confirmacion",
    accion: "Validar recepción",
    campos: [
      { label: "Piezas recibidas", tipo: "numero", requerido: true },
      { label: "Estado físico", tipo: "seleccion", requerido: true },
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
      { label: "Proveedor", tipo: "seleccion", requerido: true },
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
    campos: [{ label: "Diferencia en (piezas / peso / medidas)", tipo: "seleccion", requerido: true }],
  },
  "Bodega E2": {
    interaccion: "incidencia",
    accion: "Escalar caso",
    campos: [{ label: "Fotografías del daño", tipo: "archivo", requerido: true }],
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
  "CBX 8.5": { interaccion: "notificacion", accion: "Informar al cliente", requiere: ["CBX 8.2", "CBX 8.4"] },
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
      { label: "Aseguradora", tipo: "seleccion" },
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
      { label: "Fecha y hora de salida real", tipo: "fecha-hora", requerido: true },
    ],
  },
  "CBX 12.2": { interaccion: "notificacion", accion: "Solicitar complementaria", requiere: ["CBX 12.1"] },
  "CBX 12.3": { interaccion: "notificacion", accion: "Enviar aviso al cliente", requiere: ["CBX 12.1"] },
  "CBX 12.4": { interaccion: "notificacion", accion: "Enviar aviso a destino", requiere: ["CBX 12.1"] },
  "CBX 13.1": { interaccion: "seguimiento", requiere: ["CBX 12.2"] },
  "CBX 13.2": {
    interaccion: "notificacion",
    accion: "Notificar conclusión",
    requiere: ["CBX 13.1"],
    campos: [{ label: "Documento final", tipo: "archivo", requerido: true }],
  },
  "OPS E1": {
    interaccion: "incidencia",
    accion: "Coordinar nueva reserva",
    campos: [
      { label: "Nueva fecha de vuelo", tipo: "fecha", requerido: true },
      { label: "Nuevo booking" },
    ],
  },
  "CBX E2": {
    interaccion: "incidencia",
    accion: "Informar no salida",
    campos: [{ label: "Nueva fecha", tipo: "fecha" }],
  },
  "CBX E3": {
    interaccion: "incidencia",
    accion: "Informar incidencia",
    campos: [{ label: "Tipo (cambio / cancelación / descarga)", tipo: "seleccion", requerido: true }],
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
    campos: [{ label: "Fecha y hora de llegada", tipo: "fecha-hora", requerido: true }],
  },
  "OPS 15": {
    interaccion: "confirmacion",
    accion: "Enviar a facturación",
    campos: [{ label: "¿Cargos pendientes?", tipo: "seleccion", requerido: true }],
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

const GESTION_DEFAULT: GestionActividad = { interaccion: "formulario" };

export function gestionDe(idActividad: string): GestionActividad {
  return GESTION_ACTIVIDADES[idActividad] ?? GESTION_DEFAULT;
}

/** Campos de la actividad: los propios y después los base de su tipo. */
export function camposDe(gestion: GestionActividad): CampoGestion[] {
  return [...(gestion.campos ?? []), ...INTERACCIONES[gestion.interaccion].base];
}

export function accionDe(gestion: GestionActividad): string {
  return gestion.accion ?? INTERACCIONES[gestion.interaccion].accion;
}
