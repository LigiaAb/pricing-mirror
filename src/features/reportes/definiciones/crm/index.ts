import type { Reporte } from "../../lib/definir-reporte";
import { reporteActividades } from "./reporte-actividades";
import { reporteObjetivos } from "./reporte-objetivos";
import { reporteVisitas } from "./reporte-visitas";
import { reporteVisitasHistorico } from "./reporte-visitas-historico";

/** Reportes del módulo CRM (nomenclatura `CRM-…`), en orden de correlativo. */
export const REPORTES_CRM: readonly Reporte[] = [
  reporteVisitasHistorico,
  reporteVisitas,
  reporteActividades,
  reporteObjetivos,
];
