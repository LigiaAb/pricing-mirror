import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const ciudadSchema = z.object({
  cod_ciudad: zId,
  nombre_ciudad: z.string(),
  cod_pais: zId,
  nombre_pais: z.string().catch(""),
  siglas_ciudad: z.string().catch(""),
  cod_estado: zId.catch(1),
  estado_desc: z.string().catch(""),
});

export type Ciudad = z.infer<typeof ciudadSchema>;

export const ciudades = createCatalogo({
  nombre: "ciudades",
  schema: ciudadSchema,
  endpoints: {
    lista: "/api/appweb/lista-ciudad",
    insertar: "/api/appweb/insertar-ciudad",
    actualizar: "/api/appweb/actualizar-ciudad",
    eliminar: "/api/appweb/eliminar-ciudad",
  },
  cache: CACHE_STATIC,
});
