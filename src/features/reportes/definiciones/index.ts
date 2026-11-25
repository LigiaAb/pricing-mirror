import type { Reporte } from "../lib/definir-reporte";
import { reporteVisitasHistorico } from "./reporte-visitas-historico";

/**
 * REGISTRO DE REPORTES
 *
 * Agregar un reporte: crear su archivo en esta carpeta (copiar `reporte-visitas-historico.ts`) y
 * sumarlo a esta lista. Solo se muestran los que la API de reportes disponibles devuelve
 * para el rol y el CC del usuario (se unen por `nomenclatura`).
 */
export const REPORTES: readonly Reporte[] = [reporteVisitasHistorico];
