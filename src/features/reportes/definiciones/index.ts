import type { Reporte } from "../lib/definir-reporte";
import { llamadasVisitas } from "./llamadas-visitas";

/**
 * REGISTRO DE REPORTES
 *
 * Agregar un reporte: crear su archivo en esta carpeta (copiar `llamadas-visitas.ts`) y
 * sumarlo a esta lista. Solo se muestran los que la API de reportes disponibles devuelve
 * para el rol y el CC del usuario (se unen por `nomenclatura`).
 */
export const REPORTES: readonly Reporte[] = [llamadasVisitas];
