import type { Reporte } from "../../lib/definir-reporte";
import { reporteHitRate } from "./reporte-hit-rate";
import { reporteRealizacionDePrecio } from "./reporte-realizacion-de-precio";

/** Reportes del módulo Pricing (nomenclatura `PRI-…`), en orden de correlativo. */
export const REPORTES_PRICING: readonly Reporte[] = [reporteHitRate, reporteRealizacionDePrecio];
