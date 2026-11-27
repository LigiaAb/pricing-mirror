import type { Reporte } from "../../lib/definir-reporte";
import { reporteEmbarquesFclTransitoGt } from "./reporte-embarques-fcl-transito-gt";

/** Reportes del módulo Embarques (nomenclatura `EMB-…`), en orden de correlativo. */
export const REPORTES_EMBARQUES: readonly Reporte[] = [reporteEmbarquesFclTransitoGt];
