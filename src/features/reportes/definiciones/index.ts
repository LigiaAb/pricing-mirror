import type { Reporte } from "../lib/definir-reporte";
import { REPORTES_CRM } from "./crm";
import { REPORTES_EMBARQUES } from "./embarques";
import { REPORTES_PRICING } from "./pricing";

/**
 * REGISTRO DE REPORTES
 *
 * Una carpeta por módulo (`crm/`, …) con sus reportes y un `index.ts` con la lista del
 * módulo. Agregar un reporte: crear su archivo en la carpeta de su módulo (copiar
 * `crm/reporte-visitas-historico.ts`) y sumarlo a la lista del módulo; un módulo nuevo se
 * suma aquí. Solo se muestran los que la API de reportes disponibles devuelve para el rol y
 * el CC del usuario (se unen por `nomenclatura`).
 */
export const REPORTES: readonly Reporte[] = [
  ...REPORTES_CRM,
  ...REPORTES_PRICING,
  ...REPORTES_EMBARQUES,
];
