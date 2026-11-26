import type { Reporte } from "../../lib/definir-reporte";
import { reporteHitRate } from "./reporte-hit-rate";

/** Reportes del módulo CRM (nomenclatura `CRM-…`), en orden de correlativo. */
export const REPORTES_PRICING: readonly Reporte[] = [reporteHitRate];
