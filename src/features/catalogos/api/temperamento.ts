import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const temperamentoSchema = z.object({
  cod_temperamento: zId,
  cod_estado: zId,
  estado_desc: z.string(),
  temperamento_descripcion: z.string(),
});

export type Temperamento = z.infer<typeof temperamentoSchema>;

export const temperamento = createCatalogo({
  nombre: "temperamento",
  schema: temperamentoSchema,
  endpoints: {
    lista: "/api/appweb/lista-temperamento",
    insertar: "api/appweb/insertar-temperamento",
    actualizar: "api/appweb/actualizar-temperamento",
    eliminar: "api/appweb/eliminar-temperamento",
  },
});
