/* ==========================================================================
 * DEFINICIÓN ÚNICA DE PASOS
 *
 * - TRACKING_PASOS: los 6 pasos del tracking general (solo visual).
 * - PASOS_EMBARQUE: las tabs de gestión del embarque. Agregar/quitar una tab
 *   = 1 entrada aquí + su componente en `components/pasos/` registrado en
 *   `tabs-embarque.tsx`.
 *
 * `perfiles` indica qué pantallas (Operaciones, Bodegas, Combex) ven la tab.
 * Hoy es una propuesta: se ajusta cuando se definan las otras pantallas.
 * ========================================================================== */

import type { EstadoPaso, PasoTracking, PerfilEmbarque } from "./tipos";

/**
 * Tracking de Exportación Aérea (6 pasos consolidados).
 * Fuente: "Tracking-Expo-Aereo-6Pasos.xlsx", hoja "Tracking 6 pasos".
 * Si otras operaciones (marítimo, terrestre, importación) tienen otros pasos,
 * esta lista pasa a depender del tipo de operación.
 */
export const TRACKING_PASOS: readonly PasoTracking[] = [
  {
    id: 1,
    corto: "Reserva",
    titulo: "Coordinación y reserva",
    alcance:
      "Recolección y empaque cuando apliquen; asignación de HAWB/MAWB; solicitud y confirmación de reserva.",
    responsables: ["OPS", "Bodega"],
  },
  {
    id: 2,
    corto: "Documentación",
    titulo: "Documentación y gestión aduanera",
    alcance: "Draft, preaviso, OC para autorizar pago aéreo; gestión aduanera, DEPREX y DUCA.",
    responsables: ["OPS", "CBX"],
  },
  {
    id: 3,
    corto: "Bodega",
    titulo: "Liberación y despacho de bodega",
    alcance:
      "Salida en sistema; preparación, pase de salida, despacho e inventario de bodega.",
    responsables: ["OPS", "Bodega"],
  },
  {
    id: 4,
    corto: "COMBEX",
    titulo: "Recepción en COMBEX y documentación final",
    alcance:
      "Recepción y repeso oficial; boleta, guía definitiva, cargos y documentación final.",
    responsables: ["OPS", "CBX"],
  },
  {
    id: 5,
    corto: "Salida",
    titulo: "Despacho, salida aérea y complementaria",
    alcance:
      "Confirmación de despacho; verificación de salida; avisos y seguimiento de complementaria.",
    responsables: ["OPS", "CBX"],
  },
  {
    id: 6,
    corto: "Cierre",
    titulo: "Arribo y cierre de la operación",
    alcance:
      "Confirmación de llegada; facturación, reportes y gestión de órdenes de compra según sus condiciones originales.",
    responsables: ["OPS", "CBX"],
  },
];

export function estadoPaso(idPaso: number, pasoActual: number): EstadoPaso {
  if (idPaso < pasoActual) return "completado";
  if (idPaso === pasoActual) return "actual";
  return "pendiente";
}

export type ValorPasoEmbarque =
  | "informacion"
  | "guias"
  | "reservas"
  | "draft"
  | "tarifas"
  | "documentos"
  | "cancelacion";

export type PasoEmbarque = {
  value: ValorPasoEmbarque;
  label: string;
  detalle: string;
  /**
   * Paso del tracking donde ocurre (null = no depende de un paso).
   * Según el Excel: guías y reserva → 1 (1.1–3.2), draft → 2 (4.1–4.2),
   * confirmación de tarifas → 4 (9.2).
   */
  pasoTracking: number | null;
  /** Tabs que van separadas al final (siempre disponibles u opcionales). */
  grupo: "flujo" | "extra";
  perfiles: readonly PerfilEmbarque[];
};

const TODOS: readonly PerfilEmbarque[] = ["operaciones", "bodegas", "combex"];

export const PASOS_EMBARQUE: readonly PasoEmbarque[] = [
  {
    value: "informacion",
    label: "Información",
    detalle: "Datos del embarque",
    pasoTracking: null,
    grupo: "flujo",
    perfiles: TODOS,
  },
  {
    value: "guias",
    label: "Asignación de guías",
    detalle: "HAWB / MAWB",
    pasoTracking: 1,
    grupo: "flujo",
    perfiles: ["operaciones"],
  },
  {
    value: "reservas",
    label: "Reservas",
    detalle: "Solicitud y confirmación",
    pasoTracking: 1,
    grupo: "flujo",
    perfiles: ["operaciones"],
  },
  {
    value: "draft",
    label: "Draft",
    detalle: "Elaboración, envío y preaviso",
    pasoTracking: 2,
    grupo: "flujo",
    perfiles: ["operaciones"],
  },
  {
    value: "tarifas",
    label: "Tarifas",
    detalle: "Confirmación de cotización",
    pasoTracking: 4,
    grupo: "flujo",
    perfiles: ["operaciones"],
  },
  {
    value: "documentos",
    label: "Documentos",
    detalle: "Disponible siempre",
    pasoTracking: null,
    grupo: "extra",
    perfiles: TODOS,
  },
  {
    value: "cancelacion",
    label: "Cancelación",
    detalle: "Opcional",
    pasoTracking: null,
    grupo: "extra",
    perfiles: ["operaciones"],
  },
];

export function pasosDelPerfil(perfil: PerfilEmbarque): PasoEmbarque[] {
  return PASOS_EMBARQUE.filter((paso) => paso.perfiles.includes(perfil));
}
