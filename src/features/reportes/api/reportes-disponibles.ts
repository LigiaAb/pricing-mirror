import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { zId } from "@/shared/lib/zod-scalars";

/**
 * Reportes que puede ver el usuario según su rol y el contexto (empresa y CC), con el módulo
 * de cada uno. Sale de `REPORTE_X_CC_X_MDULO_X_ROL` + `TIPO` (`TIPO_TABLA = 'REPORTE'`).
 * Backend: `docs/backend/reportes-disponibles.js`.
 */
const reporteDisponibleSchema = z.object({
  cod_reporte: zId,
  nom_reporte: z.string().catch(""),
  nomenclatura: z.string().catch(""),
  /** `MODULO_ID`; null = el reporte aplica en todos los módulos. */
  cod_modulo: zId.nullable().catch(null),
});

export interface ReporteDisponible {
  codReporte: string | number;
  nombre: string;
  /** Une con la definición del front (`definirReporte({ nomenclatura })`). */
  nomenclatura: string;
  /** null = aplica en todos los módulos. */
  codModulo: string | null;
}

export const reportesDisponibles = createCatalogo({
  nombre: "lista-reportes-disponibles",
  schema: reporteDisponibleSchema,
  endpoints: { lista: "/api/appweb/lista-reportes-disponibles" },
  map: (raw): ReporteDisponible => ({
    codReporte: raw.cod_reporte,
    nombre: raw.nom_reporte,
    nomenclatura: raw.nomenclatura.trim().toUpperCase(),
    codModulo: raw.cod_modulo == null ? null : String(raw.cod_modulo),
  }),
  habilitado: (filtros) => filtros.cod_usuario != null && filtros.cod_empresa != null,
});
