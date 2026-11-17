import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const centroCostoModuloSchema = z.object({
  cod_cc: zId,
  cod_empresa_cc: zId,
  cod_modulo: zId,
  fecha_cc_ingreso: z.string().catch(""),
  nom_modulo: z.string().catch(""),
  nombre_emp: z.string().catch(""),
  nombre_cc: z.string().catch(""),
});

export type CentroCostoModulo = z.infer<typeof centroCostoModuloSchema>;

/**
 * Relación centro de costo ↔ módulo (`listaccxmodulo`). Sin `actualizar`: el
 * legacy solo inserta o elimina filas de la relación, nunca las edita.
 */
export const centrosCostoModulos = createCatalogo({
  nombre: "centros-costo-modulos",
  schema: centroCostoModuloSchema,
  endpoints: {
    lista: "/api/appweb/listaccxmodulo",
    insertar: "/api/appweb/insertarccxmodulo",
    eliminar: "/api/appweb/eliminarccxmodulo",
  },
});
