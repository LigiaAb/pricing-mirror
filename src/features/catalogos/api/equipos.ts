import { z } from "zod";
import { zId, zIdNull } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const equipoSchema = z.object({
  cod_equipo: zId,
  equipo_codigo: z.string().catch(""),
  equipo_descripcion: z.string().catch(""),
  equipo_tamanio: z.number().catch(0),
  equipo_capacidad: z.number().catch(0),
  equipo_operativo: z.boolean().catch(false),
  equipo_teu: z.number().catch(0),
  cod_estado: zId.catch(1),
  cod_tipo: zIdNull.catch(null),
});

export type Equipo = z.infer<typeof equipoSchema>;

export const equipos = createCatalogo({
  nombre: "equipos",
  schema: equipoSchema,
  endpoints: {
    lista: "/api/appweb/lista-equipo",
    // insertar: "api/appweb/insertarequipo",
    // actualizar: "api/appweb/actualizar-equipo",
    // eliminar: "api/appweb/eliminar-equipo",
  },
});
