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

/** Textos provisionales: confirmar con el negocio. */
export const TRACKING_PASOS: readonly PasoTracking[] = [
  { id: 1, titulo: "Apertura", descripcion: "File creado" },
  { id: 2, titulo: "Guías", descripcion: "Guías asignadas" },
  { id: 3, titulo: "Reserva", descripcion: "Reserva confirmada" },
  { id: 4, titulo: "Draft", descripcion: "Draft enviado" },
  { id: 5, titulo: "Tarifas", descripcion: "Tarifas confirmadas" },
  { id: 6, titulo: "Cierre", descripcion: "Embarque cerrado" },
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
  /** Paso del tracking al que corresponde (null = no es un paso del flujo). */
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
    pasoTracking: 1,
    grupo: "flujo",
    perfiles: TODOS,
  },
  {
    value: "guias",
    label: "Asignación de guías",
    detalle: "BL / AWB / CP",
    pasoTracking: 2,
    grupo: "flujo",
    perfiles: ["operaciones"],
  },
  {
    value: "reservas",
    label: "Reservas",
    detalle: "Solicitud y confirmación",
    pasoTracking: 3,
    grupo: "flujo",
    perfiles: ["operaciones"],
  },
  {
    value: "draft",
    label: "Draft",
    detalle: "Elaboración y envío",
    pasoTracking: 4,
    grupo: "flujo",
    perfiles: ["operaciones"],
  },
  {
    value: "tarifas",
    label: "Tarifas",
    detalle: "Confirmación de cotización",
    pasoTracking: 5,
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
