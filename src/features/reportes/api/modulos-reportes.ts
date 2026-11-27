import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { zIdNull } from "@/shared/lib/zod-scalars";

/**
 * Módulos que tienen reportes en la empresa y el CC (los del contexto actual), para el select
 * de Módulo. Sale de `REPORTE_X_CC_X_MDULO_X_ROL` + `TIPO` (`lista_modulos_reportes` del back).
 * `codModulo` null = hay reportes asignados a todos los módulos. Sin empresa no se consulta.
 */
const moduloReporteSchema = z.object({ cod_modulo: zIdNull.catch(null) });

export const modulosReportes = createCatalogo({
  nombre: "lista-modulos-reportes",
  schema: moduloReporteSchema,
  endpoints: { lista: "/api/appweb/lista-modulos-reportes" },
  map: (raw) => ({ codModulo: raw.cod_modulo == null ? null : String(raw.cod_modulo) }),
  habilitado: (filtros) => filtros.cod_empresa != null,
});
