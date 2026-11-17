import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const tratamientoSchema = z.object({
  cod_tratamiento: zId,
  cod_estado: zId,
  estado_desc: z.string(),
  tratamiento_descripcion: z.string(),
});

export type Tratamiento = z.infer<typeof tratamientoSchema>;

export const tratamiento = createCatalogo({
  nombre: "tratamiento",
  schema: tratamientoSchema,
  endpoints: {
    lista: "/api/appweb/lista-tratamiento",
    insertar: "api/appweb/insertar-tratamiento",
    actualizar: "api/appweb/actualizar-tratamiento",
    eliminar: "api/appweb/eliminar-tratamiento",
  },
});
