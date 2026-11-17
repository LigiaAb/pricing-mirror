import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const periodicidadSchema = z.object({
  cod_periodicidad: zId,
  cod_estado: z.number(),
  descripcion: z.string(),
  no_dias: z.number(),
  unidad: z.string(),
});

export type Periodicidad = z.infer<typeof periodicidadSchema>;

export const periodicidad = createCatalogo({
  nombre: "periodicidad",
  schema: periodicidadSchema,
  endpoints: {
    lista: "/api/appweb/lista-periodicidad",
    insertar: "api/appweb/insertar-periodicidad",
    actualizar: "api/appweb/actualizar-periodicidad",
    eliminar: "api/appweb/eliminar-periodicidad",
  },
});
