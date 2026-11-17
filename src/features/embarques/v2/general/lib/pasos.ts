/* ==========================================================================
 * DEFINICIÓN ÚNICA DE PASOS
 *
 * - TRACKING_PASOS: los 6 pasos del tracking general (solo visual).
 * - PASOS_EMBARQUE: las tabs de gestión del embarque. Cada tab agrupa
 *   actividades del Excel (ids de `ACTIVIDADES_TRACKING`); de ellas salen su
 *   paso (`pasoDeTab`) y qué perfiles la ven (`perfilesDeTab`). Las 69
 *   actividades están en exactamente una tab.
 *
 * Agregar una tab = 1 entrada aquí + su icono en `tabs-embarque.tsx`. Se
 * muestra con el componente genérico `pasos/paso-actividades.tsx` (salvo
 * Información y Archivos, que tienen el suyo).
 * ========================================================================== */

import { type ActividadTracking, actividadesPorId } from "../../shared/lib/actividades-tracking";
import type {
  EstadoPaso,
  PasoTracking,
  PerfilEmbarque,
  ResponsableTracking,
} from "../../shared/lib/tipos";

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
    alcance: "Salida en sistema; preparación, pase de salida, despacho e inventario de bodega.",
    responsables: ["OPS", "Bodega"],
  },
  {
    id: 4,
    corto: "COMBEX",
    titulo: "Recepción en COMBEX y documentación final",
    alcance: "Recepción y repeso oficial; boleta, guía definitiva, cargos y documentación final.",
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
  | "recoleccion"
  | "guias"
  | "reservas"
  | "draft"
  | "aduana"
  | "recepcion-bodega"
  | "despacho-bodega"
  | "combex"
  | "guia-final"
  | "tarifas"
  | "documentacion-final"
  | "salida"
  | "complementaria"
  | "cierre"
  | "archivos"
  | "cancelacion";

export type PasoEmbarque = {
  value: ValorPasoEmbarque;
  label: string;
  /** Subtítulo corto en la tab. */
  detalle: string;
  /** Descripción en el encabezado del contenido. */
  descripcion: string;
  /**
   * Actividades del Excel que se trabajan en esta tab (ids de
   * `ACTIVIDADES_TRACKING`). De aquí salen el paso y los perfiles.
   */
  actividades: readonly string[];
  /** Tabs que van separadas al final (siempre disponibles u opcionales). */
  grupo: "flujo" | "extra";
  /** Aviso destacado arriba del contenido. */
  aviso?: string;
  /** Tab sin actividades que ven todos los perfiles (Información, Archivos). */
  paraTodos?: boolean;
};

export const PASOS_EMBARQUE: readonly PasoEmbarque[] = [
  {
    value: "informacion",
    label: "Información",
    detalle: "Datos del embarque",
    descripcion: "Datos generales, partes y carga.",
    actividades: [],
    grupo: "flujo",
    paraTodos: true,
  },
  /* ---------- Paso 1 · Coordinación y reserva ---------- */
  {
    value: "recoleccion",
    label: "Recolección y empaque",
    detalle: "Cuando apliquen",
    descripcion:
      "Recolección de la carga, recepción en bodega y empaque. Solo si el servicio los incluye.",
    actividades: [
      "OPS 0.1",
      "OPS 0.2",
      "OPS 0.3",
      "Bodega 0.1",
      "Bodega 0.2",
      "Bodega 0.3",
      "OPS 0.4",
      "OPS 0.5",
      "Bodega 0.4",
      "Bodega 0.5",
    ],
    grupo: "flujo",
  },
  {
    value: "guias",
    label: "Asignación de guías",
    detalle: "HAWB / MAWB",
    descripcion: "Asignación de HAWB y registro de MAWB (sin duplicados ni saltos de correlativo).",
    actividades: ["OPS 1.1", "OPS 1.2", "OPS 1.3"],
    grupo: "flujo",
  },
  {
    value: "reservas",
    label: "Reservas",
    detalle: "Solicitud y confirmación",
    descripcion: "Solicitud de reserva a la línea aérea, validación y confirmación al cliente.",
    actividades: ["OPS 2.1", "OPS 2.2", "OPS 3.1", "OPS 3.2"],
    grupo: "flujo",
  },
  /* ---------- Paso 2 · Documentación y gestión aduanera ---------- */
  {
    value: "draft",
    label: "Draft y preaviso",
    detalle: "Borrador, preaviso y pago aéreo",
    descripcion:
      "Borrador de la guía, preaviso al destino y OC para autorizar el pago a la línea aérea.",
    actividades: ["OPS 4.1", "OPS 4.2", "OPS 4.3"],
    grupo: "flujo",
  },
  {
    value: "aduana",
    label: "Gestión aduanera",
    detalle: "Aduana, DEPREX y DUCA",
    descripcion: "Servicio aduanero, depósito DEPREX y seguimiento de la DUCA.",
    actividades: ["OPS 5.1", "OPS 5.2", "OPS 5.3", "OPS 5.4", "CBX E1"],
    grupo: "flujo",
  },
  /* ---------- Paso 3 · Liberación y despacho de bodega ---------- */
  {
    value: "recepcion-bodega",
    label: "Recepción en bodega",
    detalle: "Ingreso, repeso y etiquetado",
    descripcion: "Ingreso de la carga, verificación física, etiquetas, manifiesto y fotografías.",
    actividades: [
      "Bodega 7.1",
      "Bodega 7.2",
      "Bodega 7.3",
      "Bodega 7.4",
      "Bodega 7.5",
      "Bodega E1",
      "Bodega E2",
    ],
    grupo: "flujo",
  },
  {
    value: "despacho-bodega",
    label: "Liberación y despacho",
    detalle: "Salida, pase y despacho",
    descripcion: "Salida en sistema, transporte, pase de salida, entrega e inventario.",
    actividades: ["OPS 6.1", "Bodega 7.6", "Bodega 7.7", "Bodega 7.8", "Bodega 7.9"],
    grupo: "flujo",
  },
  /* ---------- Paso 4 · Recepción en COMBEX y documentación final ---------- */
  {
    value: "combex",
    label: "Recepción en COMBEX",
    detalle: "Repeso oficial y boleta",
    descripcion: "Entrega en terminal, peso oficial, boleta, fotografías y aviso al cliente.",
    actividades: ["CBX 8.1", "CBX 8.2", "CBX 8.3", "CBX 8.4", "CBX 8.5"],
    grupo: "flujo",
  },
  {
    value: "guia-final",
    label: "Guía final",
    detalle: "Datos definitivos y emisión",
    descripcion:
      "Datos finales con el peso oficial, emisión de la guía, aviso al cliente y seguro.",
    actividades: ["OPS 9.1", "OPS 9.3", "OPS 9.4", "OPS 9.5", "OPS E2"],
    grupo: "flujo",
  },
  {
    value: "tarifas",
    label: "Tarifas y cargos",
    detalle: "Confirmación de cotización",
    descripcion: "Tarifas y gastos reales contra la cotización (con el peso oficial de COMBEX).",
    actividades: ["OPS 9.2"],
    grupo: "flujo",
  },
  {
    value: "documentacion-final",
    label: "Documentación final",
    detalle: "Impresión en COMBEX",
    descripcion: "Hojas de seguridad, guías, manifiestos y notas de débito / crédito.",
    actividades: ["CBX 10.1", "CBX 10.2", "CBX 10.3", "CBX 10.4", "CBX 10.5"],
    grupo: "flujo",
  },
  /* ---------- Paso 5 · Despacho, salida aérea y complementaria ---------- */
  {
    value: "salida",
    label: "Despacho y salida",
    detalle: "Vuelo y avisos de salida",
    descripcion: "Confirmación de despacho, verificación de salida y avisos al cliente y destino.",
    actividades: [
      "CBX 11.1",
      "CBX 12.1",
      "CBX 12.3",
      "CBX 12.4",
      "OPS E1",
      "CBX E2",
      "CBX E3",
      "CBX E4",
    ],
    grupo: "flujo",
  },
  {
    value: "complementaria",
    label: "Complementaria",
    detalle: "Solicitud y seguimiento",
    descripcion: "Solicitud, seguimiento y cierre de la complementaria.",
    actividades: ["CBX 12.2", "CBX 13.1", "CBX 13.2"],
    grupo: "flujo",
  },
  /* ---------- Paso 6 · Arribo y cierre ---------- */
  {
    value: "cierre",
    label: "Arribo y cierre",
    detalle: "Llegada, facturación y reportes",
    descripcion: "Confirmación de llegada, facturación, estatus y órdenes de compra.",
    actividades: ["CBX 14.1", "OPS 15", "OPS 16", "OPS 17"],
    grupo: "flujo",
  },
  /* ---------- Separadas ---------- */
  {
    value: "archivos",
    label: "Archivos",
    detalle: "Consulta y descarga",
    descripcion:
      "Archivos del embarque para consulta y descarga. Se suben en la actividad que los pide o en el tracking.",
    actividades: [],
    grupo: "extra",
    paraTodos: true,
  },
  {
    value: "cancelacion",
    label: "Cancelación",
    detalle: "Opcional",
    descripcion: "Anulación de OC o reserva. Opcional: detiene el flujo del embarque.",
    actividades: ["OPS 4.4"],
    grupo: "extra",
    aviso:
      "Al cancelar o anular, el embarque deja de avanzar en el tracking y queda solo para consulta.",
  },
];

/** Perfil (pantalla) de cada área responsable del Excel. */
export const PERFIL_DE_RESPONSABLE: Record<ResponsableTracking, PerfilEmbarque> = {
  OPS: "operaciones",
  Bodega: "bodegas",
  CBX: "combex",
};

/* --------------------------------------------------------------------------
 * PERMISOS POR PERFIL
 *
 * - Operaciones orquesta el embarque: ve todas las tabs y todas las
 *   actividades, pero solo edita las de OPS; las de Bodega y Combex las ve
 *   en solo consulta.
 * - Bodegas y Combex ven solo su parte: las tabs con actividades de su área
 *   y, dentro de ellas, solo sus actividades.
 * - Información la ven todos; solo Operaciones la edita.
 * - Archivos la ven todos (solo consulta y descarga).
 * - Cancelación: solo Operaciones.
 * ------------------------------------------------------------------------ */

/** Perfiles que ven la tab. */
export function perfilesDeTab(paso: PasoEmbarque): PerfilEmbarque[] {
  const actividades = actividadesPorId(paso.actividades);
  if (actividades.length === 0) {
    return paso.paraTodos ? ["operaciones", "bodegas", "combex"] : ["operaciones"];
  }
  const perfiles = new Set<PerfilEmbarque>(["operaciones"]);
  for (const actividad of actividades) perfiles.add(PERFIL_DE_RESPONSABLE[actividad.responsable]);
  return [...perfiles];
}

export function pasosDelPerfil(perfil: PerfilEmbarque): PasoEmbarque[] {
  return PASOS_EMBARQUE.filter((paso) => perfilesDeTab(paso).includes(perfil));
}

/** Actividades de la tab que ve el perfil (Operaciones: todas; los demás: las de su área). */
export function actividadesDelPerfil(
  paso: PasoEmbarque,
  perfil: PerfilEmbarque,
): ActividadTracking[] {
  const actividades = actividadesPorId(paso.actividades);
  if (perfil === "operaciones") return actividades;
  return actividades.filter((actividad) => PERFIL_DE_RESPONSABLE[actividad.responsable] === perfil);
}

/** El perfil edita solo las actividades de su área. */
export function puedeEditar(actividad: ActividadTracking, perfil: PerfilEmbarque): boolean {
  return PERFIL_DE_RESPONSABLE[actividad.responsable] === perfil;
}

/** Información: la edita solo Operaciones. */
export function puedeEditarInformacion(perfil: PerfilEmbarque): boolean {
  return perfil === "operaciones";
}

/**
 * Paso del tracking de una tab: el último paso de sus actividades
 * (null = la tab no depende de un paso, p. ej. Información o Archivos).
 * Cancelación (OPS 4.4) es una excepción y no se marca como completada.
 */
export function pasoDeTab(paso: PasoEmbarque): number | null {
  if (paso.grupo !== "flujo") return null;
  const pasos = actividadesPorId(paso.actividades).map((actividad) => actividad.paso);
  return pasos.length > 0 ? Math.max(...pasos) : null;
}
