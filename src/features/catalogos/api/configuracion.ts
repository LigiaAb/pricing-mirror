import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const configuracionSchema = z.object({
  configuracion_id: zId,
  cod_tipo: zId,
  cod_estado: zId,
  configuracion_descripcion: z.string(),
  estado_desc: z.string(),
  nom_tipo: z.string(),
});

export type Configuracion = z.infer<typeof configuracionSchema>;

export const configuracion = createCatalogo({
  nombre: "configuracion",
  schema: configuracionSchema,
  endpoints: {
    lista: "/api/appweb/lista-configuracion",
    insertar: "api/appweb/insertar-configuracion",
    actualizar: "api/appweb/actualizar-configuracion",
  },
});
