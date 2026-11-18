/* ==========================================================================
 * OPERACIÓN · EXPORTACIÓN AÉREA
 *
 * Primera definición (ver `shared/lib/operacion.ts`). Fuente original:
 * "Tracking-Expo-Aereo-6Pasos.xlsx"; desde aquí, esta definición es la fuente
 * de verdad (pasos, actividades y responsables pueden cambiar sin Excel).
 *
 * - pasos: los 6 pasos del tracking general (hoja "Tracking 6 pasos").
 * - actividades: `ACTIVIDADES_TRACKING` (hoja "Detalle original", 69).
 * - tabs: cada tab agrupa actividades (en el orden en que se trabajan); de
 *   ellas salen su paso (`pasoDeTab`) y qué perfiles la ven (`perfilesDeTab`).
 *   Cada actividad está en exactamente una tab.
 * - responsables: perfil y gestión de cada área (OPS, Bodega, CBX).
 * - formularios: los propios de OPS (guías y solicitud de reserva).
 *
 * Agregar una tab = 1 entrada en `tabs` (con su icono). Se muestra con la tab
 * genérica `pasos/paso-actividades.tsx` (salvo Información, Archivos y
 * Bitácora, que tienen la suya).
 * ========================================================================== */

import {
  Ban,
  ClipboardList,
  FileStack,
  FileText,
  FolderOpen,
  History,
  Landmark,
  PackageCheck,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Receipt,
  Scale,
  Send,
  Ship,
  Tags,
  Truck,
  Warehouse,
} from "lucide-react";
import { GESTION_BODEGAS } from "../../../bodegas/lib/gestion-actividades";
import { GESTION_COMBEX } from "../../../combex/lib/gestion-actividades";
import { AsignacionGuias } from "../../../operaciones/components/asignacion-guias";
import { SolicitudReserva } from "../../../operaciones/components/solicitud-reserva";
import { GESTION_OPERACIONES } from "../../../operaciones/lib/gestion-actividades";
import { ACTIVIDADES_TRACKING } from "../../../shared/lib/actividades-tracking";
import { CAMPOS_FECHAS, CAMPOS_PRODUCTO, CAMPOS_RUTA } from "../../../shared/lib/campos-embarque";
import type { DefinicionOperacion, PasoEmbarque } from "../../../shared/lib/operacion";
import type { PasoTracking } from "../../../shared/lib/tipos";

/** Tracking de Exportación Aérea (6 pasos consolidados). */
const PASOS: readonly PasoTracking[] = [
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

const TABS: readonly PasoEmbarque[] = [
  {
    value: "informacion",
    label: "Información",
    detalle: "Datos del embarque",
    descripcion: "Datos generales, partes y carga.",
    icono: ClipboardList,
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
    icono: Truck,
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
    icono: Tags,
    actividades: ["OPS 1.1", "OPS 1.2", "OPS 1.3"],
    grupo: "flujo",
  },
  {
    value: "reservas",
    label: "Reservas",
    detalle: "Solicitud y confirmación",
    descripcion: "Solicitud de reserva a la línea aérea, validación y confirmación al cliente.",
    icono: Ship,
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
    icono: FileText,
    actividades: ["OPS 4.1", "OPS 4.2", "OPS 4.3"],
    grupo: "flujo",
  },
  {
    value: "aduana",
    label: "Gestión aduanera",
    detalle: "Aduana, DEPREX y DUCA",
    descripcion: "Servicio aduanero, depósito DEPREX y seguimiento de la DUCA.",
    icono: Landmark,
    actividades: ["OPS 5.1", "OPS 5.2", "OPS 5.3", "OPS 5.4", "CBX E1"],
    grupo: "flujo",
  },
  /* ---------- Paso 3 · Liberación y despacho de bodega ---------- */
  {
    value: "recepcion-bodega",
    label: "Recepción en bodega",
    detalle: "Ingreso, repeso y etiquetado",
    descripcion: "Ingreso de la carga, verificación física, etiquetas, manifiesto y fotografías.",
    icono: Warehouse,
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
    icono: PackageCheck,
    actividades: ["OPS 6.1", "Bodega 7.6", "Bodega 7.7", "Bodega 7.8", "Bodega 7.9"],
    grupo: "flujo",
  },
  /* ---------- Paso 4 · Recepción en COMBEX y documentación final ---------- */
  {
    value: "combex",
    label: "Recepción en COMBEX",
    detalle: "Repeso oficial y boleta",
    descripcion: "Entrega en terminal, peso oficial, boleta, fotografías y aviso al cliente.",
    icono: Scale,
    actividades: ["CBX 8.1", "CBX 8.2", "CBX 8.3", "CBX 8.4", "CBX 8.5"],
    grupo: "flujo",
  },
  {
    value: "guia-final",
    label: "Guía final",
    detalle: "Datos definitivos y emisión",
    descripcion:
      "Datos finales con el peso oficial, emisión de la guía, aviso al cliente y seguro.",
    icono: Send,
    actividades: ["OPS 9.1", "OPS 9.3", "OPS 9.4", "OPS 9.5", "OPS E2"],
    grupo: "flujo",
  },
  {
    value: "tarifas",
    label: "Tarifas y cargos",
    detalle: "Confirmación de cotización",
    descripcion: "Tarifas y gastos reales contra la cotización (con el peso oficial de COMBEX).",
    icono: Receipt,
    actividades: ["OPS 9.2"],
    grupo: "flujo",
  },
  {
    value: "documentacion-final",
    label: "Documentación final",
    detalle: "Impresión en COMBEX",
    descripcion: "Hojas de seguridad, guías, manifiestos y notas de débito / crédito.",
    icono: FileStack,
    actividades: ["CBX 10.1", "CBX 10.2", "CBX 10.3", "CBX 10.4", "CBX 10.5"],
    grupo: "flujo",
  },
  /* ---------- Paso 5 · Despacho, salida aérea y complementaria ---------- */
  {
    value: "salida",
    label: "Despacho y salida",
    detalle: "Vuelo y avisos de salida",
    descripcion: "Confirmación de despacho, verificación de salida y avisos al cliente y destino.",
    icono: PlaneTakeoff,
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
    icono: FileText,
    actividades: ["CBX 12.2", "CBX 13.1", "CBX 13.2"],
    grupo: "flujo",
  },
  /* ---------- Paso 6 · Arribo y cierre ---------- */
  {
    value: "cierre",
    label: "Arribo y cierre",
    detalle: "Llegada, facturación y reportes",
    descripcion: "Confirmación de llegada, facturación, estatus y órdenes de compra.",
    icono: PlaneLanding,
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
    icono: FolderOpen,
    actividades: [],
    grupo: "extra",
    paraTodos: true,
  },
  {
    value: "bitacora",
    label: "Bitácora",
    detalle: "Historial del embarque",
    descripcion: "Historial de lo que se hizo en el embarque: quién, qué y cuándo.",
    icono: History,
    actividades: [],
    grupo: "extra",
    paraTodos: true,
  },
  {
    value: "cancelacion",
    label: "Cancelación",
    detalle: "Opcional",
    descripcion: "Anulación de OC o reserva. Opcional: detiene el flujo del embarque.",
    icono: Ban,
    actividades: ["OPS 4.4"],
    grupo: "extra",
    destructiva: true,
    aviso:
      "Al cancelar o anular, el embarque deja de avanzar en el tracking y queda solo para consulta.",
  },
];

export const AEREO_EXPO: DefinicionOperacion = {
  clave: "aereo-expo",
  nombre: "Exportación Aérea",
  pasos: PASOS,
  actividades: ACTIVIDADES_TRACKING,
  tabs: TABS,
  responsables: {
    OPS: { perfil: "operaciones", gestion: GESTION_OPERACIONES },
    Bodega: { perfil: "bodegas", gestion: GESTION_BODEGAS },
    CBX: { perfil: "combex", gestion: GESTION_COMBEX },
  },
  formularios: {
    // Guías según el servicio; solicitud de reserva según la aerolínea.
    "OPS 1.1": AsignacionGuias,
    "OPS 1.2": AsignacionGuias,
    "OPS 2.1": SolicitudReserva,
  },
  informacion: {
    rutas: CAMPOS_RUTA,
    fechas: CAMPOS_FECHAS,
    producto: CAMPOS_PRODUCTO,
    iconoRutas: Plane,
  },
};
