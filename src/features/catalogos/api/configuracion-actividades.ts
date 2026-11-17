import { z } from "zod";
import { zBool, zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const configuracionActividadSchema = z.object({
  cod_configuracion_actividad: zId,
  cod_emp: z.number(),
  cod_cc: z.number(),
  abreviatura: z.string().catch(""),
  color: z.string().catch(""),
  cod_tipo_actividad: z.number(),
  cod_estado: z.number(),
  cod_tipo_resultado: z.number().catch(0),
  dias_cierre: z.number().catch(0),
  dias_creacion: z.number().catch(0),
  estado_desc: z.string().catch(""),
  fecha_creacion: z.string().nullable().catch(null),
  icono: z.string().catch(""),
  nom_tipo_actividad: z.string().catch(""),
  nom_tipo_resultado: z.string().catch(""),
  requiere_cliente: zBool.catch(false),
  solo_resultado: zBool.catch(false),
});

export type ConfiguracionActividades = z.infer<typeof configuracionActividadSchema>;

export const configuracionActividades = createCatalogo({
  nombre: "configuracion-actividades",
  schema: configuracionActividadSchema,
  endpoints: {
    lista: "api/appweb/lista-configuracion-actividad",
    insertar: "api/appweb/insertar-configuracion-actividad",
    actualizar: "api/appweb/actualizar-configuracion-actividad",
  },
});
