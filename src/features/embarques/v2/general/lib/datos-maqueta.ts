/* ==========================================================================
 * DATOS DE EJEMPLO (SOLO MAQUETA)
 *
 * Se eliminan cuando exista la API de embarques (`v2/embarques/api`).
 * ========================================================================== */

import type { EmbarqueMaqueta } from "./tipos";

export const EMBARQUES_MAQUETA: EmbarqueMaqueta[] = [
  {
    codFile: "000101",
    id: 1001,
    cliente: "CROPA DSV",
    tipoTransporte: "MARÍTIMO",
    origen: "Shanghái, CN",
    destino: "Puerto Quetzal, GT",
    carrier: "MAERSK",
    etd: "02-11-2026",
    eta: "28-11-2026",
    estado: "EN PROCESO",
    pasoActual: 3,
  },
  {
    codFile: "000102",
    id: 1002,
    cliente: "DISTRIBUIDORA ABC",
    tipoTransporte: "AÉREO",
    origen: "Miami, US",
    destino: "Guatemala, GT",
    carrier: "AVIANCA CARGO",
    etd: "14-11-2026",
    eta: "15-11-2026",
    estado: "EN PROCESO",
    pasoActual: 5,
  },
  {
    codFile: "000103",
    id: 1003,
    cliente: "IMPORTADORA XYZ",
    tipoTransporte: "TERRESTRE",
    origen: "San Salvador, SV",
    destino: "Guatemala, GT",
    carrier: "TRANSPORTES GT",
    etd: "16-11-2026",
    eta: "17-11-2026",
    estado: "NUEVO",
    pasoActual: 1,
  },
  {
    codFile: "000104",
    id: 1004,
    cliente: "COMERCIAL DEL SUR",
    tipoTransporte: "MARÍTIMO",
    origen: "Manzanillo, MX",
    destino: "Santo Tomás, GT",
    carrier: "CMA CGM",
    etd: "20-10-2026",
    eta: "30-10-2026",
    estado: "CERRADO",
    pasoActual: 6,
  },
];
