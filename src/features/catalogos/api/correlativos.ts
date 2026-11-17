import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const correlativoSchema = z.object({
  correlativo_id: zId,
  correlativo_codigo: z.string(),
  correlativo_serie: z.string().catch(""),
  correlativo_actual: z.number().catch(0),
  correlativo_inicial: z.number().catch(0),
  correlativo_final: z.number().catch(0),
  correlativo_fecha: z.string().nullable().catch(null),
  correlativo_fecha_vencimiento: z.string().nullable().catch(null),
  cod_cc: zId.catch(""),
  cod_empresa: zId.catch(""),
  cod_estado: zId.catch(""),
  cod_tipo: zId.catch(""),
  estado_desc: z.string().catch(""),
  nombre_cc: z.string().catch(""),
  nombre_emp: z.string().catch(""),
  nom_tipo: z.string().catch(""),
  tabla_correlativo: z.string().catch(""),
});

export type Correlativo = z.infer<typeof correlativoSchema>;

export const correlativos = createCatalogo({
  nombre: "correlativo",
  schema: correlativoSchema,
  endpoints: {
    lista: "api/appweb/lista-correlativos",
    insertar: "api/appweb/insertar-correlativos",
    actualizar: "/api/appweb/actualizar-correlativos",
    eliminar: "/api/appweb/eliminar-correlativo",
  },
});
