import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const commoditySchema = z.object({
  cod_commodity: zId,
  cod_estado: zId,
  descripcion: z.string(),
  nombre: z.string(),
});

export type Commodities = z.infer<typeof commoditySchema>;

export const commodities = createCatalogo({
  nombre: "commodities",
  schema: commoditySchema,
  endpoints: {
    lista: "/api/appweb/lista-commodities",
    insertar: "api/appweb/insertar-commodity",
    actualizar: "api/appweb/actualizar-commodity",
    eliminar: "api/appweb/eliminar-commodity",
  },
  cache: CACHE_STATIC,
});
