/* ==========================================================================
 * DATOS DE EJEMPLO (SOLO MAQUETA)
 *
 * Exportación aérea (el tracking actual es el de Expo Aéreo).
 * Se eliminan cuando exista la API de embarques (`v2/embarques/api`).
 * ========================================================================== */

import type { EmbarqueMaqueta } from "./tipos";

export const EMBARQUES_MAQUETA: EmbarqueMaqueta[] = [
  {
    codFile: "000101",
    id: 1001,
    cliente: "CROPA DSV",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Miami, US",
    carrier: "AVIANCA CARGO",
    etd: "02-11-2026",
    eta: "03-11-2026",
    estado: "EN PROCESO",
    pasoActual: 3,
  },
  {
    codFile: "000102",
    id: 1002,
    cliente: "DISTRIBUIDORA ABC",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Madrid, ES",
    carrier: "IBERIA CARGO",
    etd: "14-11-2026",
    eta: "15-11-2026",
    estado: "EN PROCESO",
    pasoActual: 5,
  },
  {
    codFile: "000103",
    id: 1003,
    cliente: "IMPORTADORA XYZ",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Ciudad de México, MX",
    carrier: "AEROMÉXICO CARGO",
    etd: "16-11-2026",
    eta: "17-11-2026",
    estado: "NUEVO",
    pasoActual: 1,
  },
  {
    codFile: "000104",
    id: 1004,
    cliente: "COMERCIAL DEL SUR",
    tipoTransporte: "AÉREO",
    origen: "Guatemala, GT",
    destino: "Los Ángeles, US",
    carrier: "COPA CARGO",
    etd: "20-10-2026",
    eta: "21-10-2026",
    estado: "CERRADO",
    pasoActual: 6,
  },
];
